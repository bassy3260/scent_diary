"""
scripts/evaluate_cf_minority_signal.py
─────────────────────────────────────────────────────
TF-IDF가 원래 존재하는 목적 그 자체를 테스트한다: "주력 취향(흔한 어코드)에 소수 취향
(희귀 어코드)이 묻히지 않는가?"

이전 스크립트들(evaluate_cf_rare_signal.py 등)은 "순수하게 한쪽만 소장한 유저" 클러스터를
구분하는 테스트였는데, 이건 IDF가 실제로 풀어야 하는 문제가 아니었다(우디가 두 그룹 다에
공통이라, 가중치를 만져도 상대 순위가 잘 안 바뀜). 진짜 테스트는: "우디 향수 위주로
소장하다가 레더 향수 하나를 산 유저에게, 그 소수 취향(레더)이 추천에 반영되는가?" --
이게 정확히 debug_mixed_profile.py에서 단일 유저로 확인했던 것을 다수 유저 x 여러 시드로
통계적으로 검증하는 스크립트다.

지표: 각 유저의 top-K 추천 중 레더 보유 향수가 하나라도 있는지 (survival rate).
실제 DB에는 아무것도 쓰지 않는다(읽기만).

실행:
    python scripts/evaluate_cf_minority_signal.py
"""

import random
import sys
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))
sys.path.append(str(Path(__file__).resolve().parent))

from app.db.database import fetch_accord_dict, fetch_perfume_accord_map  # noqa: E402
from app.services.cf_recommender import BM25_K, CfRecommender  # noqa: E402
from evaluate_cf import compute_user_accord_tf, wilson_ci  # noqa: E402
from evaluate_cf_rare_signal import build_pools  # noqa: E402

TOP_K = 10
N_USERS = 80
N_COMMON = 4  # 우디(흔함) 향수 개수
N_RARE = 1    # 레더(희귀) 향수 개수
SEEDS = [42, 1, 2, 3, 4, 5, 6, 7]
IDF_MODES = ["user", "catalog", "none"]
MODE_LABELS = {"user": "user-IDF", "catalog": "catalog-IDF", "none": "IDF 없음"}


def build_mixed_population(
    general_pool: list[int], pure_leather_pool: list[int], rng: random.Random
) -> pd.DataFrame:
    """유저 N_USERS명, 각자 우디 향수 N_COMMON개 + 레더 향수 N_RARE개를 소장 -- '주력
    취향 안에 소수 취향 하나가 섞인' 현실적인 프로필."""
    rows = []
    for member_id in range(1, N_USERS + 1):
        woody_items = rng.sample(general_pool, N_COMMON)
        leather_items = rng.sample(pure_leather_pool, N_RARE)
        for pid in set(woody_items + leather_items):
            rows.append({"member_id": member_id, "perfume_id": pid})
    return pd.DataFrame(rows)


def evaluate_survival(
    likes_df: pd.DataFrame,
    perfume_accord_df: pd.DataFrame,
    leather_set: set[int],
    idf_mode: str,
) -> tuple[int, int]:
    """레더 보유 향수가 top-K 추천에 하나라도 살아남은 유저 비율. (survived, total) 반환."""
    user_accord_rows = compute_user_accord_tf(likes_df, perfume_accord_df, BM25_K)
    cf = CfRecommender(bm25_k=BM25_K, idf_mode=idf_mode)
    cf._build_from_data(user_accord_rows, likes_df.to_dict("records"), perfume_accord_df.to_dict("records"))

    survived = 0
    total = 0
    for member_id in likes_df["member_id"].unique():
        if member_id not in cf.tfidf_matrix.index:
            continue
        recs = cf.recommend(member_id, top_n=TOP_K)
        total += 1
        if any(pid in leather_set for pid in recs):
            survived += 1
    return survived, total


def main() -> None:
    print("실제 향수-어코드 매핑 로딩 중 (읽기 전용)...")
    perfume_accord_df = pd.DataFrame(fetch_perfume_accord_map())
    accord_dict = fetch_accord_dict()
    name_to_id = {v: k for k, v in accord_dict.items()}
    leather_id = name_to_id["레더"]

    _, general_pool = build_pools(perfume_accord_df)  # 우디만 있는 향수 (흔함 취향용)
    leather_set = set(perfume_accord_df.loc[perfume_accord_df["accord_id"] == leather_id, "perfume_id"])
    niche_pool = set(perfume_accord_df.loc[perfume_accord_df["accord_id"] == leather_id, "perfume_id"])
    pure_leather_pool = list(leather_set - set(general_pool))  # 우디 없는 순수 레더 향수

    print(f"우디 전용 풀 {len(general_pool)}건, 순수 레더 풀 {len(pure_leather_pool)}건")
    print(f"유저 프로필: 우디 {N_COMMON}개 + 레더 {N_RARE}개, 유저 {N_USERS}명, 시드 {len(SEEDS)}개\n")

    survival_by_mode: dict[str, list[float]] = {mode: [] for mode in IDF_MODES}

    for seed in SEEDS:
        rng = random.Random(seed)
        likes_df = build_mixed_population(general_pool, pure_leather_pool, rng)

        row_str = f"시드 {seed:3d}: "
        for mode in IDF_MODES:
            survived, total = evaluate_survival(likes_df, perfume_accord_df, leather_set, mode)
            rate = survived / total if total else 0.0
            survival_by_mode[mode].append(rate)
            row_str += f"{MODE_LABELS[mode]}={rate:.3f}({survived}/{total})  "
        print(row_str)

    print(f"\n=== {len(SEEDS)}개 시드 종합: 레더 신호 생존율 (top-{TOP_K} 추천에 레더 향수가 하나라도 있는가) ===")
    for mode in IDF_MODES:
        vals = survival_by_mode[mode]
        mean = sum(vals) / len(vals)
        total_survived = round(mean * N_USERS * len(SEEDS))
        total_n = N_USERS * len(SEEDS)
        lo, hi = wilson_ci(total_survived, total_n)
        print(
            f"{MODE_LABELS[mode]:14s} 평균 생존율: {mean:.4f} [{lo:.4f}, {hi:.4f}] "
            f"(범위 {min(vals):.4f} ~ {max(vals):.4f})"
        )

    win_counts = {mode: 0 for mode in IDF_MODES}
    for i in range(len(SEEDS)):
        best_mode = max(IDF_MODES, key=lambda m: survival_by_mode[m][i])
        win_counts[best_mode] += 1
    print("시드별 우승 횟수:", ", ".join(f"{MODE_LABELS[m]}={win_counts[m]}/{len(SEEDS)}" for m in IDF_MODES))


if __name__ == "__main__":
    main()
