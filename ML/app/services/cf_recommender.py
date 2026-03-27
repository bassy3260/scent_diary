"""
app/services/cf_recommender.py
─────────────────────────────────────────────────────
소장 향수 기반 협업 필터링 추천 서비스

알고리즘:
  - BM25 TF × User-IDF 로 유저 취향 벡터 구성
  - KNN (코사인 유사도) 로 유사 유저 탐색
  - 유사도 가중 CF 점수 + 콘텐츠 점수 혼합
  - 소장 수에 따라 CF ↔ 콘텐츠 비중 자동 조절 (cold-start 대응)
─────────────────────────────────────────────────────
"""

import logging

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import normalize

from app.db.database import (
    fetch_accord_dict,
    fetch_perfume_accord_map,
    fetch_user_accord_tf,
    fetch_user_likes,
)

logger = logging.getLogger(__name__)

BM25_K = 4.0


class CfRecommender:
    def __init__(self, bm25_k: float = BM25_K):
        self.bm25_k = bm25_k

        self.tfidf_matrix: pd.DataFrame | None = None
        self.perfume_tfidf_matrix: pd.DataFrame | None = None
        self.df_likes: pd.DataFrame | None = None
        self.knn_model: NearestNeighbors | None = None
        self.user_idf_dict: dict[int, float] = {}

    # ── 초기화 (앱 시작 시 1회 호출) ─────────────────────────────────────────

    def load(self) -> None:
        logger.info("CF 추천 모델 로딩 중...")

        # 1. 유저-어코드 BM25 TF
        df_user_accord = pd.DataFrame(fetch_user_accord_tf(self.bm25_k))

        # 2. 소장 향수 목록
        self.df_likes = pd.DataFrame(fetch_user_likes())

        # 3. 향수-어코드 매핑
        df_perfume_accord = pd.DataFrame(fetch_perfume_accord_map())

        # 4. User-based IDF
        #    log(전체 유저 수 / 해당 어코드 향수를 소장한 유저 수) + 1
        total_users = df_user_accord["member_id"].nunique()
        users_per_accord = (
            df_user_accord[df_user_accord["tf"] > 0]
            .groupby("accord_id")["member_id"]
            .nunique()
            .reset_index(name="user_count")
        )
        users_per_accord["user_idf"] = (
            np.log(total_users / (1 + users_per_accord["user_count"])) + 1
        )
        self.user_idf_dict = dict(
            zip(users_per_accord["accord_id"], users_per_accord["user_idf"])
        )

        # 5. 유저 TF × User-IDF 매트릭스
        user_accord_matrix = df_user_accord.pivot(
            index="member_id", columns="accord_id", values="tf"
        ).fillna(0)
        idf_vector = np.array(
            [self.user_idf_dict.get(col, 1.0) for col in user_accord_matrix.columns]
        )
        self.tfidf_matrix = user_accord_matrix * idf_vector

        # 6. 향수 콘텐츠 벡터 (User-IDF 기반, L2 정규화)
        perfume_binary = df_perfume_accord.assign(value=1).pivot_table(
            index="perfume_id", columns="accord_id", values="value", aggfunc="max"
        ).fillna(0)
        perfume_binary = perfume_binary.reindex(
            columns=user_accord_matrix.columns, fill_value=0
        )
        self.perfume_tfidf_matrix = pd.DataFrame(
            normalize((perfume_binary * idf_vector).values, norm="l2"),
            index=perfume_binary.index,
            columns=perfume_binary.columns,
        )

        # 7. KNN 학습
        self.knn_model = NearestNeighbors(metric="cosine", algorithm="brute")
        self.knn_model.fit(self.tfidf_matrix)

        logger.info(
            "CF 추천 모델 로딩 완료: 유저 %d명 / 어코드 %d종",
            total_users,
            len(user_accord_matrix.columns),
        )

    # ── 추천 (요청마다 호출) ──────────────────────────────────────────────────

    def recommend(self, member_id: int, top_n: int = 5) -> list[int]:
        """
        member_id → 추천 향수 ID 목록 반환
        소장 향수 없으면 빈 리스트 반환
        """
        if self.tfidf_matrix is None:
            raise RuntimeError("load()를 먼저 호출하세요.")

        if member_id not in self.tfidf_matrix.index:
            return []

        # 소장 수에 따라 CF ↔ 콘텐츠 비중 결정
        owned_count = int((self.df_likes["member_id"] == member_id).sum())
        alpha = self._dynamic_alpha(owned_count)

        # KNN: 유사 유저 + 유사도 추출
        n_safe = min(11, len(self.tfidf_matrix))  # k=10 + 자기 자신
        target_vec = self.tfidf_matrix.loc[member_id].values.reshape(1, -1)
        distances, indices = self.knn_model.kneighbors(target_vec, n_neighbors=n_safe)

        similar_users = [self.tfidf_matrix.index[indices[0][i]] for i in range(1, len(indices[0]))]
        similarities  = [float(1 - distances[0][i]) for i in range(1, len(indices[0]))]

        # 유사도 가중 CF 점수
        cf_scores: dict[int, float] = {}
        for uid, sim in zip(similar_users, similarities):
            for pid in self.df_likes[self.df_likes["member_id"] == uid]["perfume_id"]:
                cf_scores[pid] = cf_scores.get(pid, 0.0) + sim

        cf_series = pd.Series(cf_scores)
        owned = set(self.df_likes[self.df_likes["member_id"] == member_id]["perfume_id"])
        cf_series = cf_series[~cf_series.index.isin(owned)]

        if cf_series.empty:
            return []

        candidate_ids   = cf_series.index.tolist()
        content_scores  = self._content_scores(member_id, candidate_ids)
        cf_norm         = self._rank_normalize(cf_series.reindex(candidate_ids, fill_value=0.0))
        content_norm    = self._rank_normalize(content_scores)
        hybrid          = (alpha * cf_norm + (1 - alpha) * content_norm).sort_values(ascending=False)

        return hybrid.head(top_n).index.tolist()

    # ── 내부 헬퍼 ─────────────────────────────────────────────────────────────

    def _dynamic_alpha(self, owned_count: int) -> float:
        if owned_count <= 2:   return 0.0
        if owned_count <= 5:   return 0.3
        if owned_count <= 10:  return 0.6
        if owned_count <= 20:  return 0.8
        return 1.0

    def _rank_normalize(self, s: pd.Series) -> pd.Series:
        if s.empty or s.max() == 0:
            return pd.Series(0.0, index=s.index)
        ranks = s.rank(ascending=False, method="min")
        return (len(s) - ranks + 1) / len(s)

    def _content_scores(self, member_id: int, perfume_ids: list[int]) -> pd.Series:
        user_vec = self.tfidf_matrix.loc[member_id].values.astype(float)
        norm = np.linalg.norm(user_vec)
        if norm == 0:
            return pd.Series(0.0, index=perfume_ids)
        user_vec /= norm

        valid_ids = [pid for pid in perfume_ids if pid in self.perfume_tfidf_matrix.index]
        if not valid_ids:
            return pd.Series(0.0, index=perfume_ids)

        scores = self.perfume_tfidf_matrix.loc[valid_ids].values @ user_vec
        return pd.Series(scores, index=valid_ids).reindex(perfume_ids, fill_value=0.0)
