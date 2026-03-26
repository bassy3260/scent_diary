"""
recommender_member_hybrid_compare.py
─────────────────────────────────────────────────────────────────────────────
[목적] 어코드 인기 편향(Popularity Bias) 해결을 위한 TF 수식 비교
 - 기존 (Log): 1 + LN(COUNT) -> 소장 횟수가 늘면 점수도 계속 증가 (편향 발생 가능성 높음)
 - 개선 (BM25): COUNT / (COUNT + K) -> 아무리 많이 소장해도 1.0(상한선)을 넘지 못함
─────────────────────────────────────────────────────────────────────────────
"""

import os
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import normalize
from dotenv import load_dotenv

load_dotenv()

ALPHA = 0.5   # CF 점수 비중 (0이면 순수 콘텐츠, 1이면 순수 CF)
BM25_K = 4.0  # 상한선 도달 속도를 조절하는 파라미터 (값이 작을수록 상한선에 빨리 도달)


class HybridPerfumeRecommender:
    def __init__(self, db_url: str, alpha: float = ALPHA, tf_method: str = 'log', bm25_k: float = BM25_K):
        self.engine = create_engine(db_url)
        self.alpha = alpha
        self.tf_method = tf_method
        self.bm25_k = bm25_k

        self.user_accord_matrix = None    # 유저별 TF (선택한 수식 적용)
        self.tfidf_matrix = None          # 유저별 TF-IDF
        self.perfume_tfidf_matrix = None  # 향수별 IDF 가중 어코드 벡터 (L2 정규화)
        self.df_member_perfume = None
        self.knn_model = None

        self.accord_dict = {}
        self.idf_dict = {}

    # ── 데이터 준비 ──────────────────────────────────────────────────────────

    def load_and_prepare_data(self):
        # 1. 어코드 이름
        df_accord = pd.read_sql("SELECT accord_id, accord_name FROM public.accord;", self.engine)
        self.accord_dict = dict(zip(df_accord['accord_id'], df_accord['accord_name']))

        # 2. 유저별 어코드 빈도(TF) 계산 방식 분기 ◀◀◀ [핵심 변경 사항]
        if self.tf_method == 'log':
            # 기존: 소장 수가 늘어나면 점수가 무한히 우상향
            tf_expr = "1 + LN(COUNT(pa.accord_id))"
        elif self.tf_method == 'bm25':
            # 개선: 아무리 많이 소장해도 1.0에 수렴하도록 상한선(Ceiling) 적용
            tf_expr = f"CAST(COUNT(pa.accord_id) AS FLOAT) / (COUNT(pa.accord_id) + {self.bm25_k})"
        else:
            raise ValueError("tf_method는 'log' 또는 'bm25'여야 합니다.")

        query_user_accord = f"""
            SELECT mp.member_id, pa.accord_id,
                   {tf_expr} AS tf,
                   COUNT(pa.accord_id) AS raw_count
            FROM public.member_perfume mp
            JOIN public.perfume_accord pa ON mp.perfume_id = pa.perfume_id
            WHERE mp.is_delete = false AND pa.is_delete = false
            GROUP BY mp.member_id, pa.accord_id;
        """
        df_user_accord = pd.read_sql(query_user_accord, self.engine)

        # 3. 유저 소장 향수 목록
        self.df_member_perfume = pd.read_sql(
            "SELECT member_id, perfume_id FROM public.member_perfume WHERE is_delete = false;",
            self.engine,
        )

        # 4. 향수-어코드 구성 (콘텐츠 벡터 구축용)
        df_perfume_accord = pd.read_sql(
            "SELECT perfume_id, accord_id FROM public.perfume_accord WHERE is_delete = false;",
            self.engine,
        )

        # 5. IDF 계산 (기존과 동일)
        total_perfumes = df_perfume_accord['perfume_id'].nunique()
        df_accord_freq = (
            df_perfume_accord.groupby('accord_id')['perfume_id']
            .nunique()
            .reset_index(name='doc_freq')
        )
        # numpy의 clip 함수를 사용해 아무리 높아도 3.5를 넘지 못하게 잘라버립니다.
        raw_idf = np.log(total_perfumes / (1 + df_accord_freq['doc_freq'])) + 1
        df_accord_freq['idf'] = np.clip(raw_idf, a_min=0, a_max=4.5)
        self.idf_dict = dict(zip(df_accord_freq['accord_id'], df_accord_freq['idf']))

        # 6. 유저 TF-IDF 매트릭스
        self.user_accord_matrix = df_user_accord.pivot(
            index='member_id', columns='accord_id', values='tf'
        ).fillna(0)
        
        # 실제 소장 카운트 로깅용
        self.user_raw_count_matrix = df_user_accord.pivot(
            index='member_id', columns='accord_id', values='raw_count'
        ).fillna(0)

        idf_vector = np.array([self.idf_dict.get(col, 1.0) for col in self.user_accord_matrix.columns])
        self.tfidf_matrix = self.user_accord_matrix * idf_vector

        # 7. 향수 TF-IDF 매트릭스 (콘텐츠 점수용)
        perfume_binary = df_perfume_accord.assign(value=1).pivot_table(
            index='perfume_id', columns='accord_id', values='value', aggfunc='max'
        ).fillna(0)
        perfume_binary = perfume_binary.reindex(columns=self.user_accord_matrix.columns, fill_value=0)
        perfume_weighted = perfume_binary * idf_vector
        self.perfume_tfidf_matrix = pd.DataFrame(
            normalize(perfume_weighted.values, norm='l2'),
            index=perfume_weighted.index,
            columns=perfume_weighted.columns,
        )

        # 8. KNN 모델
        self.knn_model = NearestNeighbors(metric='cosine', algorithm='brute')
        self.knn_model.fit(self.tfidf_matrix)

    # ── 콘텐츠 점수 계산 ─────────────────────────────────────────────────────

    def _content_scores(self, target_member_id: int, perfume_ids: list) -> pd.Series:
        user_vec = self.tfidf_matrix.loc[target_member_id].values.astype(float)
        norm = np.linalg.norm(user_vec)
        if norm == 0:
            return pd.Series(0.0, index=perfume_ids)
        user_vec /= norm

        valid_ids = [pid for pid in perfume_ids if pid in self.perfume_tfidf_matrix.index]
        if not valid_ids:
            return pd.Series(0.0, index=perfume_ids)

        scores = self.perfume_tfidf_matrix.loc[valid_ids].values @ user_vec
        return pd.Series(scores, index=valid_ids).reindex(perfume_ids, fill_value=0.0)

    # ── 메인 추천 ─────────────────────────────────────────────────────────────

    def recommend_perfumes(self, target_member_id: int, k_neighbors: int = 5, top_n: int = 5) -> dict:
        if self.tfidf_matrix is None:
            raise ValueError("데이터가 로드되지 않았습니다.")

        if target_member_id not in self.tfidf_matrix.index:
            return {'top_ids': [], 'profile': []}

        owned_count = len(self.df_member_perfume[self.df_member_perfume['member_id'] == target_member_id])
        if owned_count <= 2: alpha = 0.0
        elif owned_count <= 5: alpha = 0.3
        elif owned_count <= 10: alpha = 0.6
        elif owned_count <= 20: alpha = 0.8
        else: alpha = 1.0

        # 유저 취향 프로필 추출
        tfidf_vec = self.tfidf_matrix.loc[target_member_id]
        raw_vec = self.user_raw_count_matrix.loc[target_member_id]
        top_profile = tfidf_vec[tfidf_vec > 0].sort_values(ascending=False).head(5)
        
        profile_data = []
        for acc_id, score in top_profile.items():
            name = self.accord_dict.get(acc_id, str(acc_id))
            raw_cnt = int(raw_vec[acc_id])
            profile_data.append(f"{name}({raw_cnt}회/점수:{score:.2f})")

        # KNN 매칭
        target_vector = self.tfidf_matrix.loc[target_member_id].values.reshape(1, -1)
        distances, indices = self.knn_model.kneighbors(target_vector, n_neighbors=k_neighbors + 1)
        similar_users = [self.tfidf_matrix.index[indices[0][i]] for i in range(1, len(indices[0]))]

        # CF 후보 수집
        candidate_df = self.df_member_perfume[self.df_member_perfume['member_id'].isin(similar_users)]
        cf_scores = candidate_df.groupby('perfume_id').size().rename('cf_score').astype(float)

        owned = set(self.df_member_perfume[self.df_member_perfume['member_id'] == target_member_id]['perfume_id'])
        cf_scores = cf_scores[~cf_scores.index.isin(owned)]
        
        if cf_scores.empty:
            return {'top_ids': [], 'profile': profile_data}

        candidate_ids = cf_scores.index.tolist()
        content_scores = self._content_scores(target_member_id, candidate_ids)

        def minmax(s: pd.Series) -> pd.Series:
            mn, mx = s.min(), s.max()
            return (s - mn) / (mx - mn) if mx > mn else pd.Series(0.0, index=s.index)

        cf_norm = minmax(cf_scores.reindex(candidate_ids, fill_value=0.0))
        content_norm = minmax(content_scores)
        hybrid = (alpha * cf_norm + (1 - alpha) * content_norm).sort_values(ascending=False)

        top_ids = hybrid.head(top_n).index.tolist()
        return {'top_ids': top_ids, 'profile': profile_data}


if __name__ == "__main__":
    DB_URL = (
        f"postgresql+psycopg2://"
        f"{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}"
        f"/{os.getenv('DB_NAME')}"
    )

    TARGET_MEMBER_ID = 170 # 테스트할 유저 ID

    print(f"🚀 유저 {TARGET_MEMBER_ID}에 대한 TF 계산 방식(Log vs BM25) 비교 분석 시작...\n")

    # 1. 기존 방식 (Log TF)
    print("⏳ 기존 모델 (Log TF) 로딩 중...")
    model_log = HybridPerfumeRecommender(db_url=DB_URL, tf_method='log')
    model_log.load_and_prepare_data()
    result_log = model_log.recommend_perfumes(TARGET_MEMBER_ID)

    # 2. 개선 방식 (BM25 TF)
    print("⏳ 개선 모델 (BM25 TF) 로딩 중...")
    model_bm25 = HybridPerfumeRecommender(db_url=DB_URL, tf_method='bm25', bm25_k=3.0)
    model_bm25.load_and_prepare_data()
    result_bm25 = model_bm25.recommend_perfumes(TARGET_MEMBER_ID)

    # ── 결과 출력 ──────────────────────────────────────────────────────────
    print("\n" + "=" * 80)
    print(" 📊 [유저 취향(어코드) 분석 결과 비교]")
    print("=" * 80)
    print("■ 기존 (Log 방식): 빈도수가 높을수록 점수가 계속 치솟음 (머스크 등 편향 발생)")
    for p in result_log['profile']:
        print(f"  - {p}")
    
    print("\n■ 개선 (BM25 방식): 빈도수 상한선 적용으로 희귀 취향이 위로 올라옴!")
    for p in result_bm25['profile']:
        print(f"  - {p}")

    print("\n" + "=" * 80)
    print(" 🎯 [최종 추천 향수 ID 비교]")
    print("=" * 80)
    print(f"■ 기존 추천 결과 : {result_log['top_ids']}")
    print(f"■ 개선 추천 결과 : {result_bm25['top_ids']}")
    print("=" * 80)