import os
import pandas as pd
from sqlalchemy import create_engine
from sklearn.neighbors import NearestNeighbors
from dotenv import load_dotenv

# .env 파일 로드 (같은 폴더에 .env 파일이 있어야 함)
load_dotenv()

class PerfumeRecommender:
    def __init__(self, db_url):
        self.engine = create_engine(db_url)
        self.user_accord_matrix = None
        self.df_member_perfume = None
        self.knn_model = None
        
        # 어코드 ID -> 어코드 이름 매핑용 딕셔너리
        self.accord_dict = {}

    def load_and_prepare_data(self):
        print("⏳ DB에서 데이터를 불러오고 매트릭스를 생성 중입니다...")
        
        # 0. 어코드 이름 매핑 정보 가져오기
        query_accord = "SELECT accord_id, accord_name FROM public.accord;"
        df_accord = pd.read_sql(query_accord, self.engine)
        # { 1: 'Citrus', 2: 'Woody', ... } 형태로 저장
        self.accord_dict = dict(zip(df_accord['accord_id'], df_accord['accord_name']))

        # 1. 유저별 어코드 통계 (가중치) 가져오기
        query_user_accord = """
            SELECT 
                mp.member_id,
                pa.accord_id,
                COUNT(pa.accord_id) AS accord_weight
            FROM public.member_perfume mp
            JOIN public.perfume_accord pa ON mp.perfume_id = pa.perfume_id
            WHERE mp.is_delete = false 
              AND pa.is_delete = false
            GROUP BY mp.member_id, pa.accord_id;
        """
        df_user_accord = pd.read_sql(query_user_accord, self.engine)

        # 2. 유저별 소장 향수 목록 가져오기
        query_member_perfume = """
            SELECT member_id, perfume_id
            FROM public.member_perfume
            WHERE is_delete = false;
        """
        self.df_member_perfume = pd.read_sql(query_member_perfume, self.engine)

        # 3. User-Profile Matrix 생성 (결측치는 0으로 채움)
        self.user_accord_matrix = df_user_accord.pivot(
            index='member_id', 
            columns='accord_id', 
            values='accord_weight'
        ).fillna(0)

        # 4. KNN 모델 학습 (코사인 유사도)
        self.knn_model = NearestNeighbors(metric='cosine', algorithm='brute')
        self.knn_model.fit(self.user_accord_matrix)
        
        print("✅ 데이터 로드 및 KNN 모델 학습 완료!\n")

    def print_user_accord_stats(self, target_member_id):
        """유저의 어코드 통계를 출력합니다."""
        if target_member_id not in self.user_accord_matrix.index:
            print(f"⚠️ 유저 {target_member_id}의 향수 소장 기록이 없습니다.")
            return
            
        user_profile = self.user_accord_matrix.loc[target_member_id]
        # 0보다 큰(소장한) 어코드만 내림차순 정렬
        user_top_accords = user_profile[user_profile > 0].sort_values(ascending=False)
        
        print(f"👤 [유저 {target_member_id}님의 향 취향 통계]")
        for acc_id, weight in user_top_accords.items():
            acc_name = self.accord_dict.get(acc_id, f"알수없음({acc_id})")
            print(f"  - {acc_name}: {int(weight)}점(개)")
        print("-" * 50)

    def print_recommended_perfume_details(self, perfume_ids):
        """추천된 향수의 이름과 어코드를 조회하여 출력합니다."""
        if not perfume_ids:
            print("추천된 향수가 없습니다.")
            return
            
        # SQL IN 절에 넣기 위해 튜플 형태로 변환 (ex: (1, 2, 3))
        ids_tuple = tuple(perfume_ids)
        # 요소가 1개일 때 (1,) 형태가 되어 SQL 에러가 날 수 있으므로 예외 처리
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
        # 추천된 순서대로 출력하기 위해 반복문 사용
        for rank, pid in enumerate(perfume_ids, start=1):
            p_data = df_details[df_details['perfume_id'] == pid]
            if not p_data.empty:
                p_name = p_data.iloc[0]['perfume_name']
                # 해당 향수의 어코드 리스트 추출
                accords = p_data['accord_name'].tolist()
                print(f" {rank}위. {p_name} (ID: {pid})")
                print(f"      🌿 구성 어코드: {', '.join(accords)}")
            else:
                print(f" {rank}위. 향수 정보 없음 (ID: {pid})")
        print("=" * 50)

    def recommend_perfumes(self, target_member_id, k_neighbors=5, top_n=5):
        if self.user_accord_matrix is None:
            raise ValueError("데이터가 로드되지 않았습니다.")
            
        if target_member_id not in self.user_accord_matrix.index:
            return []

        # 1. 타겟 유저 통계 출력
        self.print_user_accord_stats(target_member_id)

        target_vector = self.user_accord_matrix.loc[target_member_id].values.reshape(1, -1)
        distances, indices = self.knn_model.kneighbors(target_vector, n_neighbors=k_neighbors + 1)

        similar_users = []
        for i in range(1, len(indices[0])):
            similar_users.append(self.user_accord_matrix.index[indices[0][i]])
            
        print(f"🤝 [유사도 매칭] 유저 {target_member_id}님과 취향이 비슷한 유저들: {similar_users}\n")

        candidate_perfumes = self.df_member_perfume[self.df_member_perfume['member_id'].isin(similar_users)]
        perfume_scores = candidate_perfumes.groupby('perfume_id').size().reset_index(name='score')
        perfume_scores = perfume_scores.sort_values(by='score', ascending=False)

        target_user_owned = self.df_member_perfume[self.df_member_perfume['member_id'] == target_member_id]['perfume_id'].tolist()
        recommended_perfumes = perfume_scores[~perfume_scores['perfume_id'].isin(target_user_owned)]
        
        result_perfume_ids = recommended_perfumes.head(top_n)['perfume_id'].tolist()
        
        # 2. 최종 추천된 향수 상세 정보 출력
        self.print_recommended_perfume_details(result_perfume_ids)
        
        return result_perfume_ids

# ==========================================
# 🚀 실행 영역
# ==========================================
if __name__ == "__main__":
    DB_URL = (
        f"postgresql+psycopg2://"
        f"{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}"
        f"/{os.getenv('DB_NAME')}"
    )
    
    recommender = PerfumeRecommender(db_url=DB_URL)
    recommender.load_and_prepare_data()
    
    # 테스트해 볼 유저 ID 지정
    TARGET_MEMBER_ID = 156
    
    print("🔎 추천 알고리즘을 시작합니다...\n" + "="*50)
    result = recommender.recommend_perfumes(target_member_id=TARGET_MEMBER_ID, k_neighbors=5, top_n=3)