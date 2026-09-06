"""
app/services/cf_recommender.py
─────────────────────────────────────────────────────
소장 향수 기반 협업 필터링 추천 서비스

알고리즘:
  - BM25 TF × Catalog-IDF 로 유저 취향 벡터 구성
  - KNN (코사인 유사도) 로 유사 유저 탐색
  - 유사도 가중 CF 점수 + 콘텐츠 점수 혼합
  - 소장 수에 따라 CF ↔ 콘텐츠 비중 자동 조절 (cold-start 대응)

IDF는 기본적으로 "향수 카탈로그" 기준(idf_mode="catalog")으로 희귀도를 잰다. 원래는
"유저" 기준(idf_mode="user")이었으나, 실험으로 검증한 결과 유저 표본이 작으면 희귀도가
왜곡돼서 정작 IDF가 있어야 할 이유(주력 취향 속 소수 취향이 묻히지 않게 하는 것)를
못 살리는 문제를 발견해 카탈로그 기준으로 교체함
(docs/cf-idf-mode-experiment.md 참고).
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
    def __init__(self, bm25_k: float = BM25_K, idf_mode: str = "catalog"):
        self.bm25_k = bm25_k
        # idf_mode: 희귀도 가중치를 어느 기준으로 매길지.
        #   "user"    - (기존 기본값) 이 어코드를 소장한 향수를 가진 "유저"가 몇 명인가 기준.
        #               유저 표본이 작거나 편향되면 실제 카탈로그 희귀도와 어긋날 수 있음.
        #   "catalog" - 전체 "향수 카탈로그"에서 이 어코드를 가진 향수가 몇 개인가 기준
        #               (교과서적인 IDF에 더 가까움, 카탈로그 크기가 고정이라 안정적).
        #   "none"    - 가중치 없음(순수 TF/이진값만).
        # scripts/evaluate_cf*.py가 세 방식을 비교하기 위한 스위치 -- 실제 서비스(load())는
        # 기본값("catalog")으로 돌아감. "user"가 원래 기본값이었으나, 실험 결과 "소수 취향
        # 보존"이라는 IDF 본연의 목적을 오히려 못 살리는 것으로 확인돼 교체함.
        self.idf_mode = idf_mode

        self.tfidf_matrix: pd.DataFrame | None = None
        self.perfume_tfidf_matrix: pd.DataFrame | None = None
        self.df_likes: pd.DataFrame | None = None
        self.knn_model: NearestNeighbors | None = None
        self.user_idf_dict: dict[int, float] = {}

    # ── 초기화 (앱 시작 시 1회 호출) ─────────────────────────────────────────

    def load(self) -> None:
        logger.info("CF 추천 모델 로딩 중...")
        self._build_from_data(
            fetch_user_accord_tf(self.bm25_k),
            fetch_user_likes(),
            fetch_perfume_accord_map(),
        )

    def _build_from_data(
        self,
        user_accord_rows: list[dict],
        likes_rows: list[dict],
        perfume_accord_rows: list[dict],
    ) -> None:
        """load()의 실제 계산 로직. DB에서 직접 안 읽고, 주어진 데이터로만 매트릭스를
        구성한다. scripts/evaluate_cf.py가 leave-one-out 평가에서 일부 소장 기록을
        제외한 데이터로 이 메서드를 직접 호출해서, 실제 서비스와 완전히 같은 알고리즘을
        평가에도 그대로 쓴다."""
        # 1. 유저-어코드 BM25 TF
        df_user_accord = pd.DataFrame(user_accord_rows)

        # 2. 소장 향수 목록
        self.df_likes = pd.DataFrame(likes_rows)

        # 3. 향수-어코드 매핑
        df_perfume_accord = pd.DataFrame(perfume_accord_rows)

        # 4. IDF (idf_mode에 따라 세 가지 중 하나)
        total_users = df_user_accord["member_id"].nunique()
        if self.idf_mode == "user":
            #    log(전체 유저 수 / 해당 어코드 향수를 소장한 유저 수) + 1
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
        elif self.idf_mode == "catalog":
            #    log(전체 향수 수 / 해당 어코드를 가진 향수 수) + 1 -- 교과서적인 IDF
            total_perfumes = df_perfume_accord["perfume_id"].nunique()
            perfumes_per_accord = (
                df_perfume_accord.groupby("accord_id")["perfume_id"]
                .nunique()
                .reset_index(name="perfume_count")
            )
            perfumes_per_accord["catalog_idf"] = (
                np.log(total_perfumes / (1 + perfumes_per_accord["perfume_count"])) + 1
            )
            self.user_idf_dict = dict(
                zip(perfumes_per_accord["accord_id"], perfumes_per_accord["catalog_idf"])
            )
        else:
            # "none" -- 모든 어코드를 동일 가중치(1.0)로 취급, 순수 TF/이진값만 사용
            self.user_idf_dict = {}

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
            logger.warning("[CF] member_id=%s 가 tfidf_matrix에 없음 (소장 향수 없는 유저)", member_id)
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
            logger.warning("[CF] member_id=%s CF 점수 계산 후 추천 후보 없음 (유사 유저들이 소장한 향수가 이미 본인 소장 목록과 동일)", member_id)
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
