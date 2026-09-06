"""
scripts/debug_flooding.py
─────────────────────────────────────────────────────
"IDF를 끄면 우디처럼 흔한 어코드를 가진 향수가 추천을 도배하지 않을까?"를 직접 확인.

방법: 니치/일반 그룹 전체 유저(120명)의 top-10 추천을 다 뽑아서,
  1) 실제로 등장한 서로 다른 향수가 몇 개인지 (적으면 "도배"가 맞음)
  2) 어느 향수가 가장 많은 유저에게 추천됐는지 (특정 향수 몇 개가 독점하면 "도배")
idf_mode="user"(기존) vs "none"(꺼짐)을 나란히 비교.
"""

import random
import sys
from collections import Counter
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))
sys.path.append(str(Path(__file__).resolve().parent))

from app.db.database import fetch_perfume_accord_map  # noqa: E402
from app.services.cf_recommender import BM25_K, CfRecommender  # noqa: E402
from evaluate_cf import compute_user_accord_tf  # noqa: E402
from evaluate_cf_rare_signal import build_pools, build_synthetic_likes  # noqa: E402

TOP_K = 10

perfume_accord_df = pd.DataFrame(fetch_perfume_accord_map())
niche_pool, general_pool = build_pools(perfume_accord_df)

rng = random.Random(42)
likes_df = build_synthetic_likes(niche_pool, general_pool, rng)[["member_id", "perfume_id"]]
user_accord_rows = compute_user_accord_tf(likes_df, perfume_accord_df, BM25_K)

for idf_mode in ["user", "none"]:
    print(f"\n{'=' * 60}\nidf_mode={idf_mode}\n{'=' * 60}")

    cf = CfRecommender(bm25_k=BM25_K, idf_mode=idf_mode)
    cf._build_from_data(user_accord_rows, likes_df.to_dict("records"), perfume_accord_df.to_dict("records"))

    all_recommended: list[int] = []
    for member_id in likes_df["member_id"].unique():
        recs = cf.recommend(member_id, top_n=TOP_K)
        all_recommended.extend(recs)

    unique_count = len(set(all_recommended))
    total_slots = len(all_recommended)
    counter = Counter(all_recommended)
    top5_most_common = counter.most_common(5)

    print(f"전체 추천 슬롯 수: {total_slots} (유저 120명 x top-{TOP_K})")
    print(f"등장한 서로 다른 향수 개수: {unique_count}건")
    print(f"가장 많이 추천된 향수 top-5 (perfume_id: 몇 명에게 추천됐나):")
    for pid, cnt in top5_most_common:
        pct = cnt / likes_df["member_id"].nunique() * 100
        print(f"  perfume_id={pid}: {cnt}명 ({pct:.1f}%)")
