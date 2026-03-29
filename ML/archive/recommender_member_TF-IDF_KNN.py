import os
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sklearn.neighbors import NearestNeighbors
from dotenv import load_dotenv

load_dotenv()

class PerfumeRecommender:
    def __init__(self, db_url):
        self.engine = create_engine(db_url)
        self.user_accord_matrix = None # 순수 빈도수 (TF)
        self.tfidf_matrix = None       # 가중치가 곱해진 최종 매트릭스 (TF-IDF)
        self.df_member_perfume = None
        self.knn_model = None
        
        self.accord_dict = {}
        self.idf_dict = {} # 어코드별 가중치를 저장할 딕셔너리

    def load_and_prepare_data(self):
        print("⏳ DB에서 데이터를 불러오고 TF-IDF 매트릭스를 생성 중입니다...")
        
        # 1. 어코드 이름 가져오기
        query_accord = "SELECT accord_id, accord_name FROM public.accord;"
        df_accord = pd.read_sql(query_accord, self.engine)
        self.accord_dict = dict(zip(df_accord['accord_id'], df_accord['accord_name']))

        # 2. 유저별 어코드 빈도수 (TF - Term Frequency)
        query_user_accord = """
            SELECT 
                mp.member_id,
                pa.accord_id,
                COUNT(pa.accord_id) AS tf
            FROM public.member_perfume mp
            JOIN public.perfume_accord pa ON mp.perfume_id = pa.perfume_id
            WHERE mp.is_delete = false 
              AND pa.is_delete = false
            GROUP BY mp.member_id, pa.accord_id;
        """
        df_user_accord = pd.read_sql(query_user_accord, self.engine)

        # 3. 유저별 소장 향수 목록 (추천 필터링용)
        query_member_perfume = """
            SELECT member_id, perfume_id
            FROM public.member_perfume
            WHERE is_delete = false;
        """
        self.df_member_perfume = pd.read_sql(query_member_perfume, self.engine)

        # 4. 전체 향수 대비 어코드 등장 빈도 (DF - Document Frequency)
        query_df = """
            SELECT accord_id, COUNT(DISTINCT perfume_id) AS doc_freq
            FROM public.perfume_accord
            WHERE is_delete = false
            GROUP BY accord_id;
        """
        df_accord_freq = pd.read_sql(query_df, self.engine)
        
        # 전체 향수 개수 (N)
        query_total_perfumes = "SELECT COUNT(DISTINCT perfume_id) as cnt FROM public.perfume_accord WHERE is_delete = false;"
        total_perfumes = pd.read_sql(query_total_perfumes, self.engine).iloc[0]['cnt']

        # 5. IDF (가중치) 계산: log(전체 향수 수 / 해당 어코드가 포함된 향수 수)
        # +1을 더해주는 이유(Smoothing): 가중치가 0이 되어 정보가 날아가는 것을 방지
        df_accord_freq['idf'] = np.log(total_perfumes / (1 + df_accord_freq['doc_freq'])) + 1
        self.idf_dict = dict(zip(df_accord_freq['accord_id'], df_accord_freq['idf']))

        # 6. User-Profile Matrix (TF) 생성
        self.user_accord_matrix = df_user_accord.pivot(
            index='member_id', 
            columns='accord_id', 
            values='tf'
        ).fillna(0)

        # 7. TF에 IDF 가중치를 곱해서 TF-IDF 매트릭스 완성!
        # 열(column) 순서에 맞춰 IDF 벡터를 생성하고 곱해줍니다.
        idf_vector = np.array([self.idf_dict.get(col, 1.0) for col in self.user_accord_matrix.columns])
        self.tfidf_matrix = self.user_accord_matrix * idf_vector

        # 8. TF-IDF 매트릭스로 KNN 모델 학습 (코사인 유사도)
        self.knn_model = NearestNeighbors(metric='cosine', algorithm='brute')
        self.knn_model.fit(self.tfidf_matrix)
        
        print("✅ TF-IDF 매트릭스 생성 및 KNN 모델 학습 완료!\n")

    def print_user_accord_stats(self, target_member_id):
        """유저의 어코드 취향을 TF-IDF 점수 기반으로 출력합니다."""
        user_profile_tfidf = self.tfidf_matrix.loc[target_member_id]
        user_profile_tf = self.user_accord_matrix.loc[target_member_id] # 순수 개수
        
        # TF-IDF 점수가 높은 순으로 정렬
        top_accords = user_profile_tfidf[user_profile_tfidf > 0].sort_values(ascending=False)
        
        print(f"👤 [유저 {target_member_id}님의 향 취향 분석 (TF-IDF 적용)]")
        for acc_id, tfidf_score in top_accords.items():
            acc_name = self.accord_dict.get(acc_id, f"알수없음({acc_id})")
            raw_count = int(user_profile_tf[acc_id])
            idf_weight = self.idf_dict.get(acc_id, 1.0)
            
            # 보기 편하게 소수점 둘째 자리까지만 출력
            print(f"  - {acc_name}: 최종 {tfidf_score:.2f}점 (소장: {raw_count}개 x 희소성 가중치: {idf_weight:.2f})")
        print("-" * 60)

    def print_recommended_perfume_details(self, perfume_ids):
        if not perfume_ids:
            print("추천된 향수가 없습니다.")
            return
            
        ids_tuple = tuple(perfume_ids)
        in_clause = f"({perfume_ids[0]})" if len(perfume_ids) == 1 else str(ids_tuple)
        
        query_perfume_detail = f"""
            SELECT 
                p.perfume_id, 
                p.perfume_name, 
                a.accord_name 
            FROM public.perfume p
            JOIN public.perfume_accord pa ON p.perfume_id = pa.perfume_id
            JOIN public.accord a ON pa.accord_id = a.accord_id
            WHERE p.perfume_id IN {in_clause}
              AND p.is_delete = false
              AND pa.is_delete = false;
        """
        df_details = pd.read_sql(query_perfume_detail, self.engine)
        
        print("🎯 [최종 추천 향수 및 어코드 정보]")
        for rank, pid in enumerate(perfume_ids, start=1):
            p_data = df_details[df_details['perfume_id'] == pid]
            if not p_data.empty:
                p_name = p_data.iloc[0]['perfume_name']
                accords = p_data['accord_name'].tolist()
                print(f" {rank}위. {p_name} (ID: {pid})")
                print(f"      🌿 구성 어코드: {', '.join(accords)}")
            else:
                print(f" {rank}위. 향수 정보 없음 (ID: {pid})")
        print("=" * 60)

    def _print_similar_user_detail(self, target_id, similar_id, similarity_score):
        """두 유저의 공통 어코드 취향을 나란히 비교 출력합니다."""
        target_vec = self.tfidf_matrix.loc[target_id]
        similar_vec = self.tfidf_matrix.loc[similar_id]

        # 둘 다 점수가 있는 어코드 = 공통 취향
        common_ids = target_vec.index[(target_vec > 0) & (similar_vec > 0)].tolist()

        if not common_ids:
            print(f"  └ 유저 {similar_id:>6}: 유사도 {similarity_score:>6.1%}  |  공통 어코드 없음")
            return

        # 타겟 유저 TF-IDF 기준 내림차순, 상위 3개만
        common_df = pd.DataFrame({
            'accord_id':     common_ids,
            'target_score':  target_vec[common_ids].values,
            'similar_score': similar_vec[common_ids].values,
        }).sort_values('target_score', ascending=False).head(3)

        accord_strs = [
            f"{self.accord_dict.get(row['accord_id'], '?')} "
            f"(나:{row['target_score']:.1f} / 상대:{row['similar_score']:.1f})"
            for _, row in common_df.iterrows()
        ]
        print(
            f"  └ 유저 {similar_id:>6}: 유사도 {similarity_score:>6.1%}  |  "
            f"공통 향 취향: {',  '.join(accord_strs)}"
        )

    def recommend_perfumes(self, target_member_id, k_neighbors=5, top_n=5):
        if self.tfidf_matrix is None:
            raise ValueError("데이터가 로드되지 않았습니다.")

        if target_member_id not in self.tfidf_matrix.index:
            print(f"⚠️ 유저 {target_member_id}의 향수 소장 기록이 없습니다.")
            return []

        # 1. 유저 통계 출력 (희소성 가중치가 곱해진 결과 확인)
        self.print_user_accord_stats(target_member_id)

        # 2. KNN 거리 계산 시 순수 TF가 아닌 TF-IDF 매트릭스 타겟 벡터 사용!
        target_vector = self.tfidf_matrix.loc[target_member_id].values.reshape(1, -1)
        distances, indices = self.knn_model.kneighbors(target_vector, n_neighbors=k_neighbors + 1)

        similar_users = []
        print(f"🤝 [유사도 매칭] 유저 {target_member_id}님과 취향이 비슷한 유저 {k_neighbors}명")
        for i in range(1, len(indices[0])):
            uid = self.tfidf_matrix.index[indices[0][i]]
            similarity_score = 1 - distances[0][i]   # cosine distance → similarity
            similar_users.append(uid)
            self._print_similar_user_detail(target_member_id, uid, similarity_score)
        print()

        # 3. 유사 유저들의 소장 향수 모으기
        candidate_perfumes = self.df_member_perfume[self.df_member_perfume['member_id'].isin(similar_users)]
        perfume_scores = candidate_perfumes.groupby('perfume_id').size().reset_index(name='score')
        perfume_scores = perfume_scores.sort_values(by='score', ascending=False)

        # 4. 이미 소장한 향수 제외
        target_user_owned = self.df_member_perfume[self.df_member_perfume['member_id'] == target_member_id]['perfume_id'].tolist()
        recommended_perfumes = perfume_scores[~perfume_scores['perfume_id'].isin(target_user_owned)]
        
        result_perfume_ids = recommended_perfumes.head(top_n)['perfume_id'].tolist()
        
        # 5. 최종 결과 상세 출력
        self.print_recommended_perfume_details(result_perfume_ids)
        
        return result_perfume_ids

if __name__ == "__main__":
    DB_URL = (
        f"postgresql+psycopg2://"
        f"{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}"
        f"/{os.getenv('DB_NAME')}"
    )
    
    recommender = PerfumeRecommender(db_url=DB_URL)
    recommender.load_and_prepare_data()
    
    TARGET_MEMBER_ID = 177
    
    print("🔎 TF-IDF 기반 추천 알고리즘을 시작합니다...\n" + "="*60)
    result = recommender.recommend_perfumes(target_member_id=TARGET_MEMBER_ID, k_neighbors=5, top_n=3)