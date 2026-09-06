"""
scripts/evaluate_cf_synthetic.py
─────────────────────────────────────────────────────
CF 추천 "알고리즘 자체"의 sanity check (목적 B).

evaluate_cf.py는 실제 소장 데이터로 "진짜 정확도"를 측정하는 것이었고, 그 결과가
데이터 희소성 때문에 baseline들과 통계적으로 구분이 안 됐다. 이 스크립트는 다른 질문을
던진다: "데이터가 충분히 있고 취향 패턴이 뚜렷하다면, CF가 최소한 그 패턴은 찾아내는가?"

방법: 실제 향수 카탈로그(어코드 매핑)는 그대로 쓰되, 소장 데이터는 인위적으로 만든다.
  - 그룹 A / 그룹 B: 서로 다른 계열의 향수 위주로 소장 (약간의 노이즈 포함)
두 그룹의 "계열"을 흔한 것 vs 희귀한 것으로 각각 골라 비교할 수 있게 파라미터화했다.
IDF는 원래 "희귀한 신호에 가중치를 더 준다"는 게 핵심이라, 흔한 어코드끼리만 비교하면
IDF 효과를 제대로 시험한 게 아니다 -- 희귀 어코드 그룹을 넣어야 IDF가 실제로 그 희귀
신호를 잘 살리는지 확인 가능.

후보 풀 크기가 다르면 Hit Rate 자체가 원래 다르게 나온다(풀이 작을수록 무작위로도 더 잘
맞음). 그래서 그룹별로 결과를 나눠서, 각 그룹의 풀 크기에 맞는 무작위 기준선과 비교한다.

주의: 이 스크립트가 만드는 숫자는 "진짜 추천 정확도"가 아니다. 실제 DB에는 아무것도
쓰지 않는다(읽기만: perfume_accord_map, accord_dict).

실행:
    python scripts/evaluate_cf_synthetic.py
"""

import random
import sys
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.database import fetch_accord_dict, fetch_perfume_accord_map  # noqa: E402
from app.services.cf_recommender import BM25_K, CfRecommender  # noqa: E402
from evaluate_cf import compute_user_accord_tf, ndcg_for_hit, wilson_ci  # noqa: E402

TOP_K = 10
USERS_PER_GROUP = 60
OWNED_PER_USER = (5, 8)  # 유저당 소장 개수 범위 (min, max)
NOISE_RATIO = 0.1  # 소장 향수 중 다른 그룹에서 섞이는 비율


def build_synthetic_likes(
    perfume_accord_df: pd.DataFrame,
    rng: random.Random,
    group_a_accord_name: str,
    group_b_accord_name: str,
) -> tuple[pd.DataFrame, dict[str, int]]:
    accord_dict = fetch_accord_dict()
    name_to_id = {name: aid for aid, name in accord_dict.items()}
    group_a_accord_id = name_to_id[group_a_accord_name]
    group_b_accord_id = name_to_id[group_b_accord_name]

    perfumes_by_accord = perfume_accord_df.groupby("accord_id")["perfume_id"].apply(set)
    group_a_perfumes = perfumes_by_accord.get(group_a_accord_id, set())
    group_b_perfumes = perfumes_by_accord.get(group_b_accord_id, set())
    # 순수하게 한쪽 계열만 가진 향수로 좁혀서 그룹 간 구분을 확실히 함
    group_a_only = list(group_a_perfumes - group_b_perfumes)
    group_b_only = list(group_b_perfumes - group_a_perfumes)
    pool_sizes = {"A": len(group_a_only), "B": len(group_b_only)}

    print(f"그룹 A('{group_a_accord_name}') 전용 향수 {pool_sizes['A']}건, "
          f"그룹 B('{group_b_accord_name}') 전용 향수 {pool_sizes['B']}건")

    rows = []
    member_id = 1
    for group_name, own_pool, other_pool in [
        ("A", group_a_only, group_b_only),
        ("B", group_b_only, group_a_only),
    ]:
        for _ in range(USERS_PER_GROUP):
            n_owned = rng.randint(*OWNED_PER_USER)
            n_noise = max(1, round(n_owned * NOISE_RATIO)) if rng.random() < NOISE_RATIO * 2 else 0
            n_own = n_owned - n_noise
            owned = rng.sample(own_pool, min(n_own, len(own_pool)))
            owned += rng.sample(other_pool, min(n_noise, len(other_pool)))
            for perfume_id in set(owned):
                rows.append({"member_id": member_id, "perfume_id": perfume_id, "group": group_name})
            member_id += 1

    return pd.DataFrame(rows), pool_sizes


def evaluate_synthetic(
    all_likes_df: pd.DataFrame,
    perfume_accord_df: pd.DataFrame,
    pool_sizes: dict[str, int],
    group_labels: dict[str, str],
) -> None:
    likes_df = all_likes_df[["member_id", "perfume_id"]]
    group_of = all_likes_df.drop_duplicates("member_id").set_index("member_id")["group"]

    # 그룹별로 따로 집계 (풀 크기가 달라서 전체 합산만 보면 오해하기 쉬움)
    stats = {g: {"hits": 0, "same_group_hits": 0, "ndcg_total": 0.0, "total": 0} for g in ["A", "B"]}

    for member_id in likes_df["member_id"].unique():
        group = group_of[member_id]
        user_rows = likes_df[likes_df["member_id"] == member_id]
        for row_idx in user_rows.index:
            held_out_perfume = likes_df.loc[row_idx, "perfume_id"]
            train_likes_df = likes_df.drop(row_idx)

            user_accord_rows = compute_user_accord_tf(train_likes_df, perfume_accord_df, BM25_K)
            recommender = CfRecommender(bm25_k=BM25_K)
            recommender._build_from_data(
                user_accord_rows,
                train_likes_df.to_dict("records"),
                perfume_accord_df.to_dict("records"),
            )
            if recommender.tfidf_matrix is None or member_id not in recommender.tfidf_matrix.index:
                continue

            recommended = recommender.recommend(member_id, top_n=TOP_K)
            s = stats[group]
            s["total"] += 1
            rank = recommended.index(held_out_perfume) + 1 if held_out_perfume in recommended else None
            if rank is not None:
                s["hits"] += 1
            s["ndcg_total"] += ndcg_for_hit(rank)

            held_out_accords = set(
                perfume_accord_df.loc[perfume_accord_df["perfume_id"] == held_out_perfume, "accord_id"]
            )
            recommended_accords = set(
                perfume_accord_df.loc[perfume_accord_df["perfume_id"].isin(recommended), "accord_id"]
            )
            if held_out_accords & recommended_accords:
                s["same_group_hits"] += 1

    print(f"\n=== 합성 데이터 sanity check 결과 (그룹별) ===")
    for g in ["A", "B"]:
        s = stats[g]
        if s["total"] == 0:
            continue
        hit_rate = s["hits"] / s["total"]
        ndcg = s["ndcg_total"] / s["total"]
        lo, hi = wilson_ci(s["hits"], s["total"])
        same_group_rate = s["same_group_hits"] / s["total"]
        random_baseline = TOP_K / pool_sizes[g] if pool_sizes[g] else 0.0

        print(f"\n-- 그룹 {g} ('{group_labels[g]}', 후보 풀 {pool_sizes[g]}건) --")
        print(f"  평가 건수: {s['total']}건")
        print(f"  Hit Rate@{TOP_K}: {hit_rate:.4f} [{lo:.4f}, {hi:.4f}] ({s['hits']}/{s['total']}건)")
        print(f"  이 그룹 풀 크기 기준 무작위 기대값: {random_baseline:.4f}")
        print(f"  NDCG@{TOP_K}: {ndcg:.4f}")
        print(f"  어코드 겹침률: {same_group_rate:.4f}")
        verdict = "무작위보다 뚜렷이 높음 (정상)" if hit_rate > random_baseline * 1.5 else "무작위와 비슷/낮음 (의심 필요)"
        print(f"  판정: {verdict}")


def run(group_a_accord_name: str, group_b_accord_name: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"[{group_a_accord_name}] vs [{group_b_accord_name}] 시나리오")
    print("=" * 60)

    perfume_accord_df = pd.DataFrame(fetch_perfume_accord_map())
    rng = random.Random(42)
    synthetic_likes_df, pool_sizes = build_synthetic_likes(
        perfume_accord_df, rng, group_a_accord_name, group_b_accord_name
    )
    print(f"합성 소장 기록 {len(synthetic_likes_df)}건 생성 완료 (실제 DB에는 아무것도 안 씀)")

    evaluate_synthetic(
        synthetic_likes_df,
        perfume_accord_df,
        pool_sizes,
        {"A": group_a_accord_name, "B": group_b_accord_name},
    )


def main() -> None:
    # 시나리오 1: 둘 다 흔한 어코드끼리 (IDF 효과가 크게 안 드러날 것으로 예상)
    run("우디", "플로럴")
    # 시나리오 2: 흔한 어코드 vs 희귀한 어코드 (IDF가 진가를 발휘해야 할 조합)
    run("우디", "레더")


if __name__ == "__main__":
    main()
