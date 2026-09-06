"""
scripts/evaluate_cf_rare_signal.py
─────────────────────────────────────────────────────
IDF가 "희귀한 신호"를 실제로 잘 살리는지 정밀 검증 (evaluate_cf_synthetic.py의 후속).

이전 스크립트(우디 vs 레더, 서로 겹치지 않는 향수)는 "그룹 간 향수 자체가 아예 다른"
경우라, 그룹을 가르는 신호가 흔한 어코드든 희귀한 어코드든 상관없이 이미 향수 목록
자체로 구분이 된다 -- IDF가 진짜로 기여하는지 제대로 시험한 게 아니었다.

여기서는 두 그룹 다 "우디"(흔함, 441건)라는 공통 신호를 갖게 하고, 오직 "레더"(희귀,
50건) 유무 하나로만 갈라지게 만든다:
  - 그룹 1(니치): 우디 + 레더를 같이 가진 향수 위주로 소장
  - 그룹 2(일반): 우디만 가지고 레더는 없는 향수 위주로 소장
TF(우디 빈도)만 보면 두 그룹이 거의 구분이 안 되고, IDF가 레더라는 희귀 신호에 제대로
가중치를 줘야만 두 그룹이 구분될 것으로 예상된다. use_idf=True/False를 직접 비교해서
IDF가 실제로 이 구분에 기여하는지를 정량적으로 본다.

지표: 추천 top-K 중 "레더를 가진 향수의 비율"(레더 정밀도).
  - 그룹 1(니치) 유저에게는 이 비율이 높을수록 좋음 (레더 취향을 알아챘다는 뜻)
  - 그룹 2(일반) 유저에게는 이 비율이 낮을수록 좋음 (레더 없는 취향을 알아챘다는 뜻)

실제 DB에는 아무것도 쓰지 않는다(읽기만).

실행:
    python scripts/evaluate_cf_rare_signal.py
"""

import random
import sys
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.database import fetch_accord_dict, fetch_perfume_accord_map  # noqa: E402
from app.services.cf_recommender import BM25_K, CfRecommender  # noqa: E402
from evaluate_cf import compute_user_accord_tf  # noqa: E402

TOP_K = 10
USERS_PER_GROUP = 60
OWNED_PER_USER = (5, 8)
NOISE_RATIO = 0.15  # 니치/일반 풀이 각각 22/443건이라, 노이즈를 조금 더 줌

COMMON_ACCORD = "우디"
RARE_ACCORD = "레더"


def build_pools(perfume_accord_df: pd.DataFrame) -> tuple[list[int], list[int]]:
    accord_dict = fetch_accord_dict()
    name_to_id = {name: aid for aid, name in accord_dict.items()}
    common_id = name_to_id[COMMON_ACCORD]
    rare_id = name_to_id[RARE_ACCORD]

    perfumes_by_accord = perfume_accord_df.groupby("accord_id")["perfume_id"].apply(set)
    common_perfumes = perfumes_by_accord.get(common_id, set())
    rare_perfumes = perfumes_by_accord.get(rare_id, set())

    niche_pool = list(common_perfumes & rare_perfumes)       # 우디 + 레더
    general_pool = list(common_perfumes - rare_perfumes)     # 우디만
    print(f"니치 풀('{COMMON_ACCORD}'+'{RARE_ACCORD}') {len(niche_pool)}건, "
          f"일반 풀('{COMMON_ACCORD}'만) {len(general_pool)}건")
    return niche_pool, general_pool


def build_synthetic_likes(niche_pool: list[int], general_pool: list[int], rng: random.Random) -> pd.DataFrame:
    rows = []
    member_id = 1
    for group_name, own_pool, other_pool in [
        ("niche", niche_pool, general_pool),
        ("general", general_pool, niche_pool),
    ]:
        for _ in range(USERS_PER_GROUP):
            n_owned = rng.randint(*OWNED_PER_USER)
            # 소장 향수 하나하나마다 독립적으로 노이즈 여부를 결정한다 (풀이 작아서 복원추출).
            # 이전엔 max(1, round(n_owned * NOISE_RATIO))로 "무조건 최소 1개"를 강제해서,
            # 일반 그룹 60명 전원이 레더 향수를 노이즈로 갖게 되고, 그 결과 레더가 더 이상
            # "희귀"하지 않게 되어 IDF 계산 자체가 무의미해지는 버그가 있었다.
            owned = [
                rng.choice(other_pool) if rng.random() < NOISE_RATIO else rng.choice(own_pool)
                for _ in range(n_owned)
            ]
            for perfume_id in set(owned):
                rows.append({"member_id": member_id, "perfume_id": perfume_id, "group": group_name})
            member_id += 1
    return pd.DataFrame(rows)


def leather_precision_at_k(recommended: list[int], rare_perfume_set: set[int]) -> float:
    if not recommended:
        return 0.0
    return sum(1 for pid in recommended if pid in rare_perfume_set) / len(recommended)


def evaluate(
    all_likes_df: pd.DataFrame,
    perfume_accord_df: pd.DataFrame,
    rare_perfume_set: set[int],
    idf_mode: str,
) -> dict[str, float]:
    likes_df = all_likes_df[["member_id", "perfume_id"]]
    group_of = all_likes_df.drop_duplicates("member_id").set_index("member_id")["group"]

    precisions = {"niche": [], "general": []}

    for member_id in likes_df["member_id"].unique():
        group = group_of[member_id]
        user_rows = likes_df[likes_df["member_id"] == member_id]
        for row_idx in user_rows.index:
            train_likes_df = likes_df.drop(row_idx)

            user_accord_rows = compute_user_accord_tf(train_likes_df, perfume_accord_df, BM25_K)
            recommender = CfRecommender(bm25_k=BM25_K, idf_mode=idf_mode)
            recommender._build_from_data(
                user_accord_rows,
                train_likes_df.to_dict("records"),
                perfume_accord_df.to_dict("records"),
            )
            if recommender.tfidf_matrix is None or member_id not in recommender.tfidf_matrix.index:
                continue

            recommended = recommender.recommend(member_id, top_n=TOP_K)
            precisions[group].append(leather_precision_at_k(recommended, rare_perfume_set))

    return {
        "niche_leather_precision": sum(precisions["niche"]) / len(precisions["niche"]) if precisions["niche"] else 0.0,
        "general_leather_precision": sum(precisions["general"]) / len(precisions["general"]) if precisions["general"] else 0.0,
        "niche_n": len(precisions["niche"]),
        "general_n": len(precisions["general"]),
    }


SEEDS = [42, 1, 2, 3, 4, 5, 6, 7]


IDF_MODES = ["user", "catalog", "none"]
MODE_LABELS = {"user": "user-IDF", "catalog": "catalog-IDF", "none": "IDF 없음"}


def run_one_seed(
    seed: int,
    perfume_accord_df: pd.DataFrame,
    niche_pool: list[int],
    general_pool: list[int],
    rare_perfume_set: set[int],
) -> dict[str, dict]:
    rng = random.Random(seed)
    likes_df = build_synthetic_likes(niche_pool, general_pool, rng)
    return {
        mode: evaluate(likes_df, perfume_accord_df, rare_perfume_set, idf_mode=mode)
        for mode in IDF_MODES
    }


def main() -> None:
    print("실제 향수-어코드 매핑 로딩 중 (읽기 전용)...")
    perfume_accord_df = pd.DataFrame(fetch_perfume_accord_map())
    rare_perfume_set = set(
        perfume_accord_df.loc[
            perfume_accord_df["accord_id"] == {v: k for k, v in fetch_accord_dict().items()}[RARE_ACCORD],
            "perfume_id",
        ]
    )
    niche_pool, general_pool = build_pools(perfume_accord_df)
    print(f"시드 {len(SEEDS)}개로 반복 평가 시작: {SEEDS}\n")

    gaps: dict[str, list[float]] = {mode: [] for mode in IDF_MODES}

    for seed in SEEDS:
        results = run_one_seed(seed, perfume_accord_df, niche_pool, general_pool, rare_perfume_set)
        row_str = f"시드 {seed:3d}: "
        for mode in IDF_MODES:
            gap = results[mode]["niche_leather_precision"] - results[mode]["general_leather_precision"]
            gaps[mode].append(gap)
            row_str += f"{MODE_LABELS[mode]}={gap:.4f}  "
        winner = max(IDF_MODES, key=lambda m: gaps[m][-1])
        print(row_str + f"-> {MODE_LABELS[winner]} 우세")

    print(f"\n=== {len(SEEDS)}개 시드 종합 ===")
    for mode in IDF_MODES:
        vals = gaps[mode]
        mean = sum(vals) / len(vals)
        print(f"{MODE_LABELS[mode]:14s} 구분력 평균: {mean:.4f} (범위 {min(vals):.4f} ~ {max(vals):.4f})")

    win_counts = {mode: 0 for mode in IDF_MODES}
    for i in range(len(SEEDS)):
        best_mode = max(IDF_MODES, key=lambda m: gaps[m][i])
        win_counts[best_mode] += 1
    print("시드별 우승 횟수:", ", ".join(f"{MODE_LABELS[m]}={win_counts[m]}/{len(SEEDS)}" for m in IDF_MODES))
    print(
        "\n판정: 한 방식이 대부분의 시드에서 일관되게 이기면 실제 경향, "
        "승패가 시드마다 뒤섞이면 우연에 가깝다는 뜻."
    )


if __name__ == "__main__":
    main()
