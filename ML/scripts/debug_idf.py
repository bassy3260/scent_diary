"""
scripts/debug_idf.py
─────────────────────────────────────────────────────
왜 IDF를 켜면 "우디+레더" 니치 그룹 구분이 오히려 나빠지는지, 실제 벡터 값을
찍어서 추적한다. evaluate_cf_rare_signal.py와 같은 합성 데이터(seed=42)를 재사용.
"""

import random
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))
sys.path.append(str(Path(__file__).resolve().parent))

from app.db.database import fetch_accord_dict, fetch_perfume_accord_map  # noqa: E402
from app.services.cf_recommender import BM25_K, CfRecommender  # noqa: E402
from evaluate_cf import compute_user_accord_tf  # noqa: E402
from evaluate_cf_rare_signal import build_pools, build_synthetic_likes  # noqa: E402

accord_dict = fetch_accord_dict()
perfume_accord_df = pd.DataFrame(fetch_perfume_accord_map())
niche_pool, general_pool = build_pools(perfume_accord_df)

rng = random.Random(42)
likes_df = build_synthetic_likes(niche_pool, general_pool, rng)[["member_id", "perfume_id"]]

niche_user = 1       # niche 그룹 첫 유저 (build_synthetic_likes에서 niche가 먼저 만들어짐)
general_user = 61    # general 그룹 첫 유저 (USERS_PER_GROUP=60 이후부터 general)

print(f"니치 유저({niche_user}) 소장:", sorted(likes_df[likes_df.member_id == niche_user]["perfume_id"].tolist()))
print(f"일반 유저({general_user}) 소장:", sorted(likes_df[likes_df.member_id == general_user]["perfume_id"].tolist()))

user_accord_rows = compute_user_accord_tf(likes_df, perfume_accord_df, BM25_K)

for idf_mode in ["user", "catalog", "none"]:
    print(f"\n{'=' * 70}")
    print(f"idf_mode={idf_mode}")
    print("=" * 70)

    cf = CfRecommender(bm25_k=BM25_K, idf_mode=idf_mode)
    cf._build_from_data(user_accord_rows, likes_df.to_dict("records"), perfume_accord_df.to_dict("records"))

    # 1. 우디/레더/기타 어코드의 IDF 값
    name_to_id = {v: k for k, v in accord_dict.items()}
    woody_id, leather_id = name_to_id["우디"], name_to_id["레더"]
    print(f"\n[IDF 값] 우디={cf.user_idf_dict.get(woody_id, 1.0):.4f}  레더={cf.user_idf_dict.get(leather_id, 1.0):.4f}")
    other_ids = [name_to_id[n] for n in ["웜 스파이시", "프레시 스파이시", "스모키", "아로마틱"] if n in name_to_id]
    for aid in other_ids:
        name = accord_dict[aid]
        print(f"         {name}={cf.user_idf_dict.get(aid, 1.0):.4f}")

    # 2. 니치 유저 벡터에서 0이 아닌 성분들 (accord_name: 값)
    niche_vec = cf.tfidf_matrix.loc[niche_user]
    nonzero = niche_vec[niche_vec != 0].sort_values(ascending=False)
    print(f"\n[니치 유저 벡터, 0 아닌 성분] (유저 자신의 TF x IDF)")
    for aid, val in nonzero.items():
        print(f"  {accord_dict.get(aid, aid):12s}: {val:.4f}")

    # 3. 후보 향수 두 개(니치 하나, 일반 하나)의 perfume_tfidf_matrix 벡터
    niche_perfume_sample = niche_pool[0]
    general_perfume_sample = general_pool[0]
    for label, pid in [("니치 향수", niche_perfume_sample), ("일반 향수", general_perfume_sample)]:
        if pid not in cf.perfume_tfidf_matrix.index:
            continue
        pvec = cf.perfume_tfidf_matrix.loc[pid]
        nz = pvec[pvec != 0].sort_values(ascending=False)
        print(f"\n[{label} perfume_id={pid} 벡터, L2 정규화 후 0 아닌 성분]")
        for aid, val in nz.items():
            print(f"  {accord_dict.get(aid, aid):12s}: {val:.4f}")

    # 4. 니치 유저 기준, 두 후보 향수와의 content score(코사인 유사도) 직접 계산
    user_vec = niche_vec.values.astype(float)
    norm = np.linalg.norm(user_vec)
    if norm > 0:
        user_vec = user_vec / norm
    for label, pid in [("니치 향수", niche_perfume_sample), ("일반 향수", general_perfume_sample)]:
        if pid not in cf.perfume_tfidf_matrix.index:
            continue
        score = cf.perfume_tfidf_matrix.loc[pid].values @ user_vec
        print(f"\n[content score] 니치 유저 vs {label}({pid}): {score:.4f}")
