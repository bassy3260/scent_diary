"""
scripts/debug_mixed_profile.py
─────────────────────────────────────────────────────
"우디 향수 4개 + 레더 향수 1개"처럼 섞인, 훨씬 현실적인 유저 프로필에서도
희귀 신호(레더)가 추천에 살아남는지 확인. 지금까지의 니치/일반 그룹은 "순수하게
한쪽만" 소장한 극단적인 경우였는데, 이건 훨씬 더 흔할 법한 "주력 취향 + 튀는 취향 1개"
케이스를 직접 테스트한다.

기존 120명(니치60/일반60) 인구에 이 프로필의 유저를 1명 추가로 끼워넣고, 그 유저에게
실제로 뭐가 추천되는지, top-10 중 레더 향수가 몇 개나 들어가는지 확인한다.
"""

import random
import sys
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))
sys.path.append(str(Path(__file__).resolve().parent))

from app.db.database import fetch_accord_dict, fetch_perfume_accord_map  # noqa: E402
from app.services.cf_recommender import BM25_K, CfRecommender  # noqa: E402
from evaluate_cf import compute_user_accord_tf  # noqa: E402
from evaluate_cf_rare_signal import build_pools, build_synthetic_likes  # noqa: E402

TOP_K = 10
TEST_USER_ID = 999999

accord_dict = fetch_accord_dict()
name_to_id = {v: k for k, v in accord_dict.items()}
leather_id = name_to_id["레더"]

perfume_accord_df = pd.DataFrame(fetch_perfume_accord_map())
niche_pool, general_pool = build_pools(perfume_accord_df)  # niche=우디+레더, general=우디만

# "순수 레더" 풀(우디는 없고 레더만 있는 향수)도 따로 뽑는다 -- 우디 신호와 완전히
# 분리된 "튀는 취향 1개"를 만들기 위해.
leather_all = set(
    perfume_accord_df.loc[perfume_accord_df["accord_id"] == leather_id, "perfume_id"]
)
pure_leather_pool = list(leather_all - set(niche_pool))
print(f"순수 레더(우디 없음) 향수 풀: {len(pure_leather_pool)}건")

rng = random.Random(42)
base_likes_df = build_synthetic_likes(niche_pool, general_pool, rng)[["member_id", "perfume_id"]]

# 테스트 유저: 우디만 있는 향수 4개 + 순수 레더 향수 1개
test_woody = rng.sample(general_pool, 4)
test_leather = rng.sample(pure_leather_pool, 1)
test_rows = pd.DataFrame(
    [{"member_id": TEST_USER_ID, "perfume_id": pid} for pid in test_woody + test_leather]
)
likes_df = pd.concat([base_likes_df, test_rows], ignore_index=True)

print(f"테스트 유저 소장: 우디 향수 {test_woody}, 레더 향수 {test_leather}\n")

for idf_mode in ["user", "none"]:
    print(f"{'=' * 60}\nidf_mode={idf_mode}\n{'=' * 60}")

    user_accord_rows = compute_user_accord_tf(likes_df, perfume_accord_df, BM25_K)
    cf = CfRecommender(bm25_k=BM25_K, idf_mode=idf_mode)
    cf._build_from_data(user_accord_rows, likes_df.to_dict("records"), perfume_accord_df.to_dict("records"))

    if idf_mode == "user":
        print(f"[참고] 이 유저 벡터의 우디 IDF={cf.user_idf_dict.get(name_to_id['우디'], 1.0):.4f}, "
              f"레더 IDF={cf.user_idf_dict.get(leather_id, 1.0):.4f}")

    recommended = cf.recommend(TEST_USER_ID, top_n=TOP_K)
    leather_in_rec = [pid for pid in recommended if pid in leather_all]

    print(f"추천 top-{TOP_K}: {recommended}")
    print(f"그중 레더 보유 향수: {leather_in_rec}  ({len(leather_in_rec)}/{TOP_K}건)\n")
