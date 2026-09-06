"""
scripts/evaluate_cf.py
─────────────────────────────────────────────────────
CF(협업 필터링) 추천의 정확도를 leave-one-out 방식으로 측정한다.

방법 (leave-one-out):
  유저가 실제로 소장한 향수 중 하나를 "정답"으로 숨기고, 나머지 소장 데이터만으로
  CF 모델을 다시 구성해서 추천을 뽑는다. 그 추천 목록 안에 숨겨둔 정답이 들어있는지로
  Hit Rate@K, NDCG@K를 계산한다. 이 과정을 모든 (유저, 소장 향수) 쌍에 대해 반복한다.

DB는 읽기만 한다(member_perfume/perfume_accord를 한 번씩만 조회). "하나 빼고 다시 계산"은
전부 메모리(pandas) 안에서 처리하므로 실제 데이터는 전혀 건드리지 않는다.

비교 기준(baseline): 아무 개인화 없이 "그냥 전체에서 제일 많이 소장된 향수 top-K"를
추천했을 때의 Hit Rate/NDCG도 같이 계산한다. CF가 이 baseline보다 못하면, CF가 사실상
아무 의미가 없다는 뜻이라 반드시 같이 봐야 하는 숫자다.

실행:
    python scripts/evaluate_cf.py
"""

import math
import random
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import text

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.database import fetch_perfume_accord_map, fetch_user_likes, get_connection  # noqa: E402
from app.services.cf_recommender import BM25_K, CfRecommender  # noqa: E402

TOP_K = 10
MIN_OWNED_FOR_EVAL = 2  # 소장 1개뿐인 유저는 그 1개를 빼면 소장 0개가 되어 평가가 안 됨


def compute_user_accord_tf(likes_df: pd.DataFrame, perfume_accord_df: pd.DataFrame, k: float) -> list[dict]:
    """fetch_user_accord_tf()의 SQL 쿼리(BM25 TF 계산)를 pandas로 그대로 재현한다.
    leave-one-out마다 SQL을 다시 날리는 대신, 이미 메모리에 있는 데이터로 매번
    다시 계산하기 위함(원본 SQL: COUNT(*) / (COUNT(*) + k), member_id/accord_id로 GROUP BY)."""
    merged = likes_df.merge(perfume_accord_df, on="perfume_id")
    counts = (
        merged.groupby(["member_id", "accord_id"])
        .size()
        .reset_index(name="count")
    )
    counts["tf"] = counts["count"] / (counts["count"] + k)
    return counts[["member_id", "accord_id", "tf"]].to_dict("records")


def ndcg_for_hit(rank: int | None) -> float:
    """정답이 없으면(rank=None) 0, 있으면 1/log2(rank+1).
    관련 항목이 하나뿐인 경우 IDCG는 항상 1이라, 이 값 자체가 곧 NDCG."""
    if rank is None:
        return 0.0
    return 1.0 / math.log2(rank + 1)


def wilson_ci(hits: int, total: int, z: float = 1.96) -> tuple[float, float]:
    """Hit Rate의 95% 신뢰구간 (Wilson score interval).
    Hit Rate가 1% 안팎으로 아주 작을 때는 이 구간을 안 보면, 우연히 몇 건
    더/덜 맞은 것만으로 "차이가 있다"고 착각하기 쉽다."""
    if total == 0:
        return (0.0, 0.0)
    p = hits / total
    denom = 1 + z**2 / total
    center = (p + z**2 / (2 * total)) / denom
    margin = (z * math.sqrt(p * (1 - p) / total + z**2 / (4 * total**2))) / denom
    return (max(0.0, center - margin), min(1.0, center + margin))


def evaluate_cf(
    all_likes_df: pd.DataFrame,
    perfume_accord_df: pd.DataFrame,
    idf_mode: str = "user",
) -> tuple[float, float, int, int]:
    """CF 추천의 leave-one-out Hit Rate@K, NDCG@K를 계산한다.
    idf_mode: "user"(기존 기본값) / "catalog"(향수 카탈로그 기준) / "none"(가중치 없음)
    세 가지를 비교하는 ablation용."""
    user_counts = all_likes_df.groupby("member_id").size()
    eligible_users = user_counts[user_counts >= MIN_OWNED_FOR_EVAL].index.tolist()

    hits = 0
    ndcg_total = 0.0
    total = 0

    for member_id in eligible_users:
        user_rows = all_likes_df[all_likes_df["member_id"] == member_id]
        for row_idx in user_rows.index:
            held_out_perfume = all_likes_df.loc[row_idx, "perfume_id"]
            train_likes_df = all_likes_df.drop(row_idx)

            user_accord_rows = compute_user_accord_tf(train_likes_df, perfume_accord_df, BM25_K)
            recommender = CfRecommender(bm25_k=BM25_K, idf_mode=idf_mode)
            recommender._build_from_data(
                user_accord_rows,
                train_likes_df.to_dict("records"),
                perfume_accord_df.to_dict("records"),
            )

            if recommender.tfidf_matrix is None or member_id not in recommender.tfidf_matrix.index:
                continue  # 방어 코드: 이론상 MIN_OWNED_FOR_EVAL 필터로 걸러졌어야 함

            recommended = recommender.recommend(member_id, top_n=TOP_K)
            total += 1
            rank = recommended.index(held_out_perfume) + 1 if held_out_perfume in recommended else None
            if rank is not None:
                hits += 1
            ndcg_total += ndcg_for_hit(rank)

    hit_rate = hits / total if total else 0.0
    ndcg = ndcg_total / total if total else 0.0
    return hit_rate, ndcg, total, hits


def evaluate_popularity_baseline(all_likes_df: pd.DataFrame) -> tuple[float, float, int, int]:
    """개인화 전혀 없이 "전체에서 가장 많이 소장된 향수 top-K"를 모두에게 추천했을 때의
    Hit Rate@K, NDCG@K. CF가 이 baseline보다 유의미하게 나은지 비교하는 기준선."""
    user_counts = all_likes_df.groupby("member_id").size()
    eligible_users = user_counts[user_counts >= MIN_OWNED_FOR_EVAL].index.tolist()

    hits = 0
    ndcg_total = 0.0
    total = 0

    for member_id in eligible_users:
        user_rows = all_likes_df[all_likes_df["member_id"] == member_id]
        owned_all = set(user_rows["perfume_id"])
        for row_idx in user_rows.index:
            held_out_perfume = all_likes_df.loc[row_idx, "perfume_id"]
            train_likes_df = all_likes_df.drop(row_idx)

            # held-out 제외한 전체 인기 순위 (본인이 이미 소장 중인 나머지 향수는 후보에서 제외)
            popularity = train_likes_df["perfume_id"].value_counts()
            owned_except_held_out = owned_all - {held_out_perfume}
            popularity = popularity[~popularity.index.isin(owned_except_held_out)]
            recommended = popularity.head(TOP_K).index.tolist()

            total += 1
            rank = recommended.index(held_out_perfume) + 1 if held_out_perfume in recommended else None
            if rank is not None:
                hits += 1
            ndcg_total += ndcg_for_hit(rank)

    hit_rate = hits / total if total else 0.0
    ndcg = ndcg_total / total if total else 0.0
    return hit_rate, ndcg, total, hits


def fetch_all_active_perfume_ids() -> list[int]:
    """무작위 baseline의 후보 전체(카탈로그 전체)를 위한 것 -- 이 평가 스크립트
    전용의 가벼운 쿼리라 database.py에 정식으로 추가하지 않고 여기서만 씀."""
    query = text("SELECT perfume_id FROM perfume WHERE is_delete = false")
    with get_connection() as conn:
        return [row[0] for row in conn.execute(query).all()]


def evaluate_random_baseline(all_likes_df: pd.DataFrame, all_perfume_ids: list[int]) -> tuple[float, float, int, int]:
    """완전 무작위로 top-K를 뽑았을 때의 Hit Rate/NDCG. CF나 인기 baseline이
    이 값보다도 안 높으면, 그 방식은 사실상 의미가 없다는 뜻이라 반드시 같이 봐야 함."""
    rng = random.Random(42)
    user_counts = all_likes_df.groupby("member_id").size()
    eligible_users = user_counts[user_counts >= MIN_OWNED_FOR_EVAL].index.tolist()

    hits = 0
    ndcg_total = 0.0
    total = 0

    for member_id in eligible_users:
        user_rows = all_likes_df[all_likes_df["member_id"] == member_id]
        owned_all = set(user_rows["perfume_id"])
        for row_idx in user_rows.index:
            held_out_perfume = all_likes_df.loc[row_idx, "perfume_id"]
            owned_except_held_out = owned_all - {held_out_perfume}
            candidates = [pid for pid in all_perfume_ids if pid not in owned_except_held_out]
            recommended = rng.sample(candidates, min(TOP_K, len(candidates)))

            total += 1
            rank = recommended.index(held_out_perfume) + 1 if held_out_perfume in recommended else None
            if rank is not None:
                hits += 1
            ndcg_total += ndcg_for_hit(rank)

    hit_rate = hits / total if total else 0.0
    ndcg = ndcg_total / total if total else 0.0
    return hit_rate, ndcg, total, hits


def main() -> None:
    print("데이터 로딩 중...")
    all_likes_df = pd.DataFrame(fetch_user_likes())
    perfume_accord_df = pd.DataFrame(fetch_perfume_accord_map())
    print(f"소장 기록 {len(all_likes_df)}건, 유저 {all_likes_df['member_id'].nunique()}명\n")

    print(f"[CF (user-IDF, 기존 기본값)] leave-one-out 평가 중 (top-{TOP_K})...")
    user_hit_rate, user_ndcg, user_total, user_hits = evaluate_cf(all_likes_df, perfume_accord_df, idf_mode="user")

    print(f"[CF (catalog-IDF, 향수 카탈로그 기준)] leave-one-out 평가 중 (top-{TOP_K})...")
    cat_hit_rate, cat_ndcg, cat_total, cat_hits = evaluate_cf(all_likes_df, perfume_accord_df, idf_mode="catalog")

    print(f"[CF (IDF 없음, 순수 TF)] leave-one-out 평가 중 (top-{TOP_K})...")
    none_hit_rate, none_ndcg, none_total, none_hits = evaluate_cf(all_likes_df, perfume_accord_df, idf_mode="none")

    print(f"[인기 향수 baseline] 평가 중 (top-{TOP_K})...")
    base_hit_rate, base_ndcg, base_total, base_hits = evaluate_popularity_baseline(all_likes_df)

    print(f"[무작위 baseline] 평가 중 (top-{TOP_K})...")
    all_perfume_ids = fetch_all_active_perfume_ids()
    rand_hit_rate, rand_ndcg, rand_total, rand_hits = evaluate_random_baseline(all_likes_df, all_perfume_ids)

    print("\n=== 결과 (괄호는 95% 신뢰구간 -- 겹치면 그 차이는 통계적으로 유의미하지 않음) ===")
    rows = [
        ("CF (user-IDF)", user_hit_rate, user_ndcg, user_total, user_hits),
        ("CF (catalog-IDF)", cat_hit_rate, cat_ndcg, cat_total, cat_hits),
        ("CF (IDF 없음)", none_hit_rate, none_ndcg, none_total, none_hits),
        ("인기 향수 baseline", base_hit_rate, base_ndcg, base_total, base_hits),
        ("무작위 baseline", rand_hit_rate, rand_ndcg, rand_total, rand_hits),
    ]
    for label, hit_rate, ndcg, total, hits in rows:
        lo, hi = wilson_ci(hits, total)
        print(
            f"{label:18s} Hit Rate@{TOP_K}: {hit_rate:.4f} "
            f"[{lo:.4f}, {hi:.4f}] ({hits}/{total}건)   NDCG@{TOP_K}: {ndcg:.4f}"
        )


if __name__ == "__main__":
    main()
