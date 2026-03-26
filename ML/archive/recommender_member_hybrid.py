"""
recommender_member_hybrid.py
─────────────────────────────────────────────────────────────────────────────
기존 recommender_member_TF-IDF_KNN.py 와의 핵심 차이점
─────────────────────────────────────────────────────────────────────────────
[기존]  후보 향수 점수 = 유사 유저 몇 명이 소장했나 (단순 카운트)
[이것]  후보 향수 점수 = α × CF점수  +  (1-α) × 콘텐츠 점수

콘텐츠 점수 = 내 TF-IDF 취향 벡터 · 해당 향수의 어코드 벡터 (코사인 유사도)
→ "비슷한 유저가 소장했고, 실제로 내 취향 어코드와도 맞는 향수"를 상위 추천
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


class HybridPerfumeRecommender:
    def __init__(self, db_url: str, alpha: float = ALPHA):
        self.engine = create_engine(db_url)
        self.alpha = alpha

        self.user_accord_matrix = None    # 유저별 TF (순수 빈도)
        self.tfidf_matrix = None          # 유저별 TF-IDF
        self.perfume_tfidf_matrix = None  # 향수별 IDF 가중 어코드 벡터 (L2 정규화)
        self.df_member_perfume = None
        self.knn_model = None

        self.accord_dict = {}
        self.idf_dict = {}

    # ── 데이터 준비 ──────────────────────────────────────────────────────────

    def load_and_prepare_data(self):
        print("⏳ DB에서 데이터를 불러오는 중...")

        # 1. 어코드 이름
        df_accord = pd.read_sql("SELECT accord_id, accord_name FROM public.accord;", self.engine)
        self.accord_dict = dict(zip(df_accord['accord_id'], df_accord['accord_name']))

        # 2. 유저별 어코드 빈도(TF) → Sublinear 스케일링: 1 + log(count)
        # 희귀 향수 1개만 소장해도 IDF와 곱해져 점수가 튀는 문제를 완화
        # raw count 대신 log를 씌워 소장 수가 늘어도 점수가 선형으로 올라가지 않도록 함
        query_user_accord = """
            SELECT mp.member_id, pa.accord_id,
                   1 + LN(COUNT(pa.accord_id)) AS tf
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

        # 4. 향수-어코드 구성 (콘텐츠 벡터 구축용) ← 기존 파일에 없던 쿼리
        df_perfume_accord = pd.read_sql(
            "SELECT perfume_id, accord_id FROM public.perfume_accord WHERE is_delete = false;",
            self.engine,
        )

        # 5. IDF 계산
        total_perfumes = df_perfume_accord['perfume_id'].nunique()
        df_accord_freq = (
            df_perfume_accord.groupby('accord_id')['perfume_id']
            .nunique()
            .reset_index(name='doc_freq')
        )
        df_accord_freq['idf'] = np.log(total_perfumes / (1 + df_accord_freq['doc_freq'])) + 1
        self.idf_dict = dict(zip(df_accord_freq['accord_id'], df_accord_freq['idf']))

        # 6. 유저 TF-IDF 매트릭스
        self.user_accord_matrix = df_user_accord.pivot(
            index='member_id', columns='accord_id', values='tf'
        ).fillna(0)
        idf_vector = np.array([self.idf_dict.get(col, 1.0) for col in self.user_accord_matrix.columns])
        self.tfidf_matrix = self.user_accord_matrix * idf_vector

        # 7. 향수 TF-IDF 매트릭스 (콘텐츠 점수용) ← 핵심 추가
        #    향수는 어코드 보유 여부(0/1)에 IDF 가중치 적용 후 L2 정규화
        #    → 유저 벡터와 내적하면 코사인 유사도가 나옴
        perfume_binary = df_perfume_accord.assign(value=1).pivot_table(
            index='perfume_id', columns='accord_id', values='value', aggfunc='max'
        ).fillna(0)
        # 유저 매트릭스와 동일한 어코드 컬럼 공간으로 정렬
        perfume_binary = perfume_binary.reindex(columns=self.user_accord_matrix.columns, fill_value=0)
        perfume_weighted = perfume_binary * idf_vector
        self.perfume_tfidf_matrix = pd.DataFrame(
            normalize(perfume_weighted.values, norm='l2'),
            index=perfume_weighted.index,
            columns=perfume_weighted.columns,
        )

        # 8. KNN 모델 (유저 간 유사도, 기존과 동일)
        self.knn_model = NearestNeighbors(metric='cosine', algorithm='brute')
        self.knn_model.fit(self.tfidf_matrix)

        print(
            f"✅ 준비 완료! "
            f"유저 {len(self.tfidf_matrix)}명 / "
            f"향수 {len(self.perfume_tfidf_matrix)}개 / "
            f"어코드 {len(self.user_accord_matrix.columns)}종\n"
        )

    # ── 콘텐츠 점수 계산 ─────────────────────────────────────────────────────

    def _content_scores(self, target_member_id: int, perfume_ids: list) -> pd.Series:
        """
        내 TF-IDF 프로필 벡터 × 후보 향수 어코드 벡터 → 코사인 유사도

        향수 벡터는 이미 L2 정규화됨.
        유저 벡터도 여기서 정규화 → 내적 = 코사인 유사도.
        """
        user_vec = self.tfidf_matrix.loc[target_member_id].values.astype(float)
        norm = np.linalg.norm(user_vec)
        if norm == 0:
            return pd.Series(0.0, index=perfume_ids)
        user_vec /= norm

        valid_ids = [pid for pid in perfume_ids if pid in self.perfume_tfidf_matrix.index]
        if not valid_ids:
            return pd.Series(0.0, index=perfume_ids)

        scores = self.perfume_tfidf_matrix.loc[valid_ids].values @ user_vec  # (n_perfumes,)
        return pd.Series(scores, index=valid_ids).reindex(perfume_ids, fill_value=0.0)

    def _matching_accords(self, target_member_id: int, perfume_id: int, top_n: int = 3) -> list[str]:
        """내 취향과 이 향수가 공유하는 어코드 (내 TF-IDF 점수 높은 순)"""
        if perfume_id not in self.perfume_tfidf_matrix.index:
            return []
        user_vec = self.tfidf_matrix.loc[target_member_id]
        perfume_vec = self.perfume_tfidf_matrix.loc[perfume_id]
        match_ids = user_vec.index[(user_vec > 0) & (perfume_vec > 0)].tolist()
        match_ids.sort(key=lambda aid: user_vec[aid], reverse=True)
        return [self.accord_dict.get(aid, f"?({aid})") for aid in match_ids[:top_n]]

    # ── 출력 헬퍼 ────────────────────────────────────────────────────────────

    def print_user_accord_stats(self, target_member_id: int):
        tfidf_vec = self.tfidf_matrix.loc[target_member_id]
        tf_vec = self.user_accord_matrix.loc[target_member_id]
        top = tfidf_vec[tfidf_vec > 0].sort_values(ascending=False)

        print(f"👤 [유저 {target_member_id}님의 향 취향 분석 (TF-IDF 적용)]")
        for acc_id, score in top.items():
            name = self.accord_dict.get(acc_id, f"알수없음({acc_id})")
            print(
                f"  - {name}: {score:.2f}점 "
                f"(소장 {int(tf_vec[acc_id])}개 × 희소성 {self.idf_dict.get(acc_id, 1.0):.2f})"
            )
        print("-" * 60)

    def _print_similar_user_detail(self, target_id: int, similar_id: int, similarity_score: float):
        target_vec = self.tfidf_matrix.loc[target_id]
        similar_vec = self.tfidf_matrix.loc[similar_id]
        common_ids = target_vec.index[(target_vec > 0) & (similar_vec > 0)].tolist()

        if not common_ids:
            print(f"  └ 유저 {similar_id:>6}: 유사도 {similarity_score:>6.1%}  |  공통 어코드 없음")
            return

        common_df = pd.DataFrame({
            'accord_id':     common_ids,
            'target_score':  target_vec[common_ids].values,
            'similar_score': similar_vec[common_ids].values,
        }).sort_values('target_score', ascending=False).head(3)

        accord_strs = [
            f"{self.accord_dict.get(r['accord_id'], '?')} (나:{r['target_score']:.1f}/상대:{r['similar_score']:.1f})"
            for _, r in common_df.iterrows()
        ]
        print(
            f"  └ 유저 {similar_id:>6}: 유사도 {similarity_score:>6.1%}  |  "
            f"공통 향: {',  '.join(accord_strs)}"
        )

    # ── 메인 추천 ─────────────────────────────────────────────────────────────

    def recommend_perfumes(self, target_member_id: int, k_neighbors: int = 5, top_n: int = 5) -> list:
        if self.tfidf_matrix is None:
            raise ValueError("데이터가 로드되지 않았습니다.")

        if target_member_id not in self.tfidf_matrix.index:
            print(f"⚠️ 유저 {target_member_id}의 향수 소장 기록이 없습니다.")
            return []

        # 1. 소장 수에 따라 alpha 자동 결정
        #    소장이 적을수록 CF 신뢰도가 낮으므로 콘텐츠 비중을 높임
        owned_count = len(
            self.df_member_perfume[self.df_member_perfume['member_id'] == target_member_id]
        )
        if owned_count <= 2:
            alpha = 0.0    # 콘텐츠 100%
        elif owned_count <= 5:
            alpha = 0.3
        elif owned_count <= 10:
            alpha = 0.6
        elif owned_count <= 20:
            alpha = 0.8
        else:
            alpha = 1.0    # CF 100%
        print(f"📦 소장 향수 {owned_count}개 → α={alpha} (CF {alpha:.0%} / 콘텐츠 {1-alpha:.0%})\n")

        # 2. 유저 취향 출력
        self.print_user_accord_stats(target_member_id)

        # 2. KNN으로 유사 유저 탐색 (기존과 동일)
        target_vector = self.tfidf_matrix.loc[target_member_id].values.reshape(1, -1)
        distances, indices = self.knn_model.kneighbors(target_vector, n_neighbors=k_neighbors + 1)

        similar_users = []
        print(f"🤝 [유사도 매칭] 유저 {target_member_id}님과 취향이 비슷한 유저 {k_neighbors}명")
        for i in range(1, len(indices[0])):
            uid = self.tfidf_matrix.index[indices[0][i]]
            sim = 1 - distances[0][i]
            similar_users.append(uid)
            self._print_similar_user_detail(target_member_id, uid, sim)
        print()

        # 3. 후보 향수 수집 + CF 점수
        candidate_df = self.df_member_perfume[self.df_member_perfume['member_id'].isin(similar_users)]
        cf_scores = candidate_df.groupby('perfume_id').size().rename('cf_score').astype(float)

        # 4. 내 소장 향수 제외
        owned = set(
            self.df_member_perfume[
                self.df_member_perfume['member_id'] == target_member_id
            ]['perfume_id']
        )
        cf_scores = cf_scores[~cf_scores.index.isin(owned)]
        if cf_scores.empty:
            print("추천할 향수가 없습니다.")
            return []

        candidate_ids = cf_scores.index.tolist()

        # 5. 콘텐츠 점수: 내 취향 × 향수 어코드 ← 기존 파일에 없는 핵심 부분
        content_scores = self._content_scores(target_member_id, candidate_ids)

        # 6. 두 점수를 0~1 Min-Max 정규화 후 가중 혼합
        def minmax(s: pd.Series) -> pd.Series:
            mn, mx = s.min(), s.max()
            return (s - mn) / (mx - mn) if mx > mn else pd.Series(0.0, index=s.index)

        cf_norm      = minmax(cf_scores.reindex(candidate_ids, fill_value=0.0))
        content_norm = minmax(content_scores)
        hybrid       = (alpha * cf_norm + (1 - alpha) * content_norm).sort_values(ascending=False)

        top_ids = hybrid.head(top_n).index.tolist()

        # 7. 향수 이름 일괄 조회
        ids_sql = ", ".join(str(pid) for pid in top_ids)
        df_names = pd.read_sql(
            f"SELECT perfume_id, perfume_name FROM public.perfume WHERE perfume_id IN ({ids_sql}) AND is_delete = false;",
            self.engine,
        )
        name_map = dict(zip(df_names['perfume_id'], df_names['perfume_name']))

        # 8. 결과 출력 — 소장 인원 수(원본) / CF / 콘텐츠 / 최종 점수를 나란히 보여줌
        print(
            f"🎯 [최종 추천 향수]  α={alpha} × CF점수  +  {1 - alpha} × 콘텐츠 점수\n"
            f"{'순위':<4} {'향수명':<35} {'소장인원':>8} {'CF(정규화)':>10} {'콘텐츠':>8} {'최종':>8}  내 취향과 맞는 어코드"
        )
        print("-" * 110)
        for rank, pid in enumerate(top_ids, start=1):
            p_name    = name_map.get(pid, f"ID:{pid}")
            matched   = self._matching_accords(target_member_id, pid)
            match_str = ', '.join(matched) if matched else '(매칭 어코드 없음)'
            raw_count = int(cf_scores.get(pid, 0))
            print(
                f"{rank:<4} {p_name:<35} "
                f"{raw_count:>6}명   "
                f"{cf_norm.get(pid, 0):>8.2f} "
                f"{content_norm.get(pid, 0):>8.2f} "
                f"{hybrid.get(pid, 0):>8.2f}  "
                f"{match_str}"
            )
        print("=" * 110)

        return top_ids


if __name__ == "__main__":
    DB_URL = (
        f"postgresql+psycopg2://"
        f"{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}"
        f"/{os.getenv('DB_NAME')}"
    )

    TARGET_MEMBER_ID = 130

    # ── TF-IDF 행렬 시각화 ────────────────────────────────────────────────
    _viz = HybridPerfumeRecommender(db_url=DB_URL)
    _viz.load_and_prepare_data()

    # 어코드 ID → 이름 변환 후 점수 높은 어코드 상위 8개만 열로 추출
    top_accord_ids = _viz.tfidf_matrix.max(axis=0).nlargest(8).index.tolist()
    top_accord_names = [_viz.accord_dict.get(aid, str(aid)) for aid in top_accord_ids]

    # TARGET 유저 포함 유저 5명만 행으로 추출
    sample_users = [TARGET_MEMBER_ID] + [
        uid for uid in _viz.tfidf_matrix.index if uid != TARGET_MEMBER_ID
    ][:4]

    sample_df = _viz.tfidf_matrix.loc[sample_users, top_accord_ids].copy()
    sample_df.columns = top_accord_names
    sample_df.index.name = "member_id"

    print("\n📊 [TF-IDF 행렬 샘플]  행=유저 / 열=어코드 / 값=TF-IDF 점수 (원본)")
    print("(0.00 = 해당 어코드 향수 미소장)\n")
    print(sample_df.round(2).to_string())
    print()

    # L2 정규화: 각 유저 벡터를 길이 1로 만들기
    # → 점수 절댓값이 아닌 "취향의 방향(비율)"만 남음
    from sklearn.preprocessing import normalize as sk_normalize
    tfidf_normed = pd.DataFrame(
        sk_normalize(_viz.tfidf_matrix.values, norm='l2'),
        index=_viz.tfidf_matrix.index,
        columns=_viz.tfidf_matrix.columns,
    )
    normed_df = tfidf_normed.loc[sample_users, top_accord_ids].copy()
    normed_df.columns = top_accord_names
    normed_df.index.name = "member_id"

    print("📊 [L2 정규화 후 행렬 샘플]  각 유저 벡터 길이 = 1.0")
    print("(원본 점수 크기가 사라지고 어코드 간 '비율'만 남음)\n")
    print(normed_df.round(3).to_string())
    print()

    # ── 기존 방식 ──────────────────────────────────────────────────────────
    # 파일명에 하이픈(-)이 있어 일반 import 불가 → importlib으로 직접 로드
    import importlib.util, pathlib
    _spec = importlib.util.spec_from_file_location(
        "recommender_tfidf_knn",
        pathlib.Path(__file__).parent / "recommender_member_TF-IDF_KNN.py",
    )
    _mod = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)
    PerfumeRecommender = _mod.PerfumeRecommender
    print("=" * 95)
    print("[ 기존: TF-IDF KNN (단순 카운트) ]")
    print("=" * 95)
    old = PerfumeRecommender(db_url=DB_URL)
    old.load_and_prepare_data()
    old_result = old.recommend_perfumes(target_member_id=TARGET_MEMBER_ID, k_neighbors=5, top_n=5)

    # ── 하이브리드 방식 ────────────────────────────────────────────────────
    print("\n" + "=" * 95)
    print(f"[ 새로운: Hybrid CF + Contents  (α={ALPHA}) ]")
    print("=" * 95)
    hybrid = HybridPerfumeRecommender(db_url=DB_URL, alpha=ALPHA)
    hybrid.load_and_prepare_data()
    new_result = hybrid.recommend_perfumes(target_member_id=TARGET_MEMBER_ID, k_neighbors=5, top_n=5)

    # ── 결과 비교 ──────────────────────────────────────────────────────────
    print("\n📊 [결과 비교]")
    print(f"  기존 추천: {old_result}")
    print(f"  하이브리드: {new_result}")
    overlap = set(old_result) & set(new_result)
    print(f"  공통 추천: {sorted(overlap)} ({len(overlap)}개)")
