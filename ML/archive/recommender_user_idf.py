"""
recommender_user_idf.py
══════════════════════════════════════════════════════════════════════════════
BM25 Hybrid 대비 변경점 3가지
══════════════════════════════════════════════════════════════════════════════

[변경 1] IDF 계산 기준: 향수 → 유저                              ★ 핵심
  기존: log(전체 향수 수  / 해당 어코드를 가진 향수 수)
  개선: log(전체 유저 수  / 해당 어코드 향수를 소장한 유저 수)

  왜?: 목표는 '유저를 구분'하는 것이다.
       우디 어코드가 모든 유저의 소장 목록에 있다면
       → 유저를 구분하는 데 쓸모없다 → IDF가 낮아야 한다.
       카탈로그에 우디 향수가 많든 적든 그건 상관없다.

[변경 2] CF 점수: 단순 카운트 → 유사도 가중 합산
  기존: cf_score[pid] += 1   (소장 여부만)
  개선: cf_score[pid] += sim (유사도 높은 유저 = 더 큰 영향)

  왜?: 유사도 90% 유저와 50% 유저가 같은 가중치를 갖는 건 정보 손실이다.

[변경 3] 정규화: MinMax → Rank 기반
  기존: (score - min) / (max - min)  → outlier 1개가 전체를 0으로 눌러버림
  개선: rank → (N - rank + 1) / N   → 분포 형태에 무관하게 안정적

[유지]  BM25 TF (상한선 1.0), Dynamic alpha (소장 수 기반 CF↔콘텐츠 비율)
══════════════════════════════════════════════════════════════════════════════
"""

import os
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import normalize
import pathlib
from dotenv import load_dotenv

# archive/ 하위에서 실행해도 ML/.env 를 찾을 수 있도록 경로를 명시
load_dotenv(dotenv_path=pathlib.Path(__file__).parent.parent / ".env")

BM25_K = 4.0   # BM25 TF 포화 속도 조절 (작을수록 빨리 상한에 도달)


# ══════════════════════════════════════════════════════════════════════════════
# 클래스
# ══════════════════════════════════════════════════════════════════════════════

class UserIdfRecommender:
    def __init__(self, db_url: str, bm25_k: float = BM25_K):
        self.engine  = create_engine(db_url)
        self.bm25_k  = bm25_k

        self.tfidf_matrix         = None   # 유저 × 어코드 (BM25-TF × User-IDF)
        self.user_accord_matrix   = None   # 유저 × 어코드 (TF만, 로깅용)
        self.user_raw_count_matrix= None   # 유저 × 어코드 (raw count, 로깅용)
        self.perfume_tfidf_matrix = None   # 향수 × 어코드 (콘텐츠 점수용, L2 정규화)
        self.df_member_perfume    = None   # 유저별 소장 향수 목록

        self.accord_dict    = {}           # accord_id → accord_name
        self.user_idf_dict  = {}           # accord_id → user-based IDF 값

    # ──────────────────────────────────────────────────────────────────────────
    # 데이터 준비
    # ──────────────────────────────────────────────────────────────────────────

    def load_and_prepare_data(self) -> None:
        print("⏳ 데이터 로드 중...\n")

        # ── Step 1. 어코드 이름 매핑 ──────────────────────────────────────────
        df_accord = pd.read_sql(
            "SELECT accord_id, accord_name FROM public.accord;", self.engine
        )
        self.accord_dict = dict(zip(df_accord["accord_id"], df_accord["accord_name"]))

        # ── Step 2. 유저별 어코드 BM25 TF 계산 ───────────────────────────────
        #
        # BM25 TF = COUNT / (COUNT + K)
        #   COUNT=1 → 1/(1+4) = 0.20
        #   COUNT=3 → 3/(3+4) = 0.43
        #   COUNT=10→ 10/(10+4)= 0.71   ← 아무리 많아도 1.0 미만에 수렴
        #
        # 목적: 우디를 30개 소장한 유저가 3개 소장한 유저보다 점수가 10배 높은
        #       극단 편향을 막기 위해 상한선을 설정한다.
        query_user_accord = f"""
            SELECT mp.member_id,
                   pa.accord_id,
                   CAST(COUNT(*) AS FLOAT) / (COUNT(*) + {self.bm25_k}) AS tf,
                   COUNT(*) AS raw_count
            FROM   public.member_perfume mp
            JOIN   public.perfume_accord pa ON mp.perfume_id = pa.perfume_id
            WHERE  mp.is_delete = false
              AND  pa.is_delete = false
            GROUP  BY mp.member_id, pa.accord_id;
        """
        df_user_accord = pd.read_sql(query_user_accord, self.engine)

        # ── Step 3. 소장 향수 목록 ────────────────────────────────────────────
        self.df_member_perfume = pd.read_sql(
            "SELECT member_id, perfume_id FROM public.member_perfume WHERE is_delete = false;",
            self.engine,
        )

        # ── Step 4. 향수-어코드 매핑 (콘텐츠 점수용) ─────────────────────────
        df_perfume_accord = pd.read_sql(
            "SELECT perfume_id, accord_id FROM public.perfume_accord WHERE is_delete = false;",
            self.engine,
        )

        # ── Step 5. [핵심] User-based IDF 계산 ───────────────────────────────
        #
        # 질문: "이 어코드는 유저를 구분하는 데 얼마나 도움이 되는가?"
        #
        # user_idf(accord) = log( 전체 유저 수 / 해당 어코드 향수를 소장한 유저 수 ) + 1
        #
        # 예) 우디 어코드
        #   - 향수 기준 IDF: log(1300/300) + 1 = 2.47  ← "중간" 으로 평가
        #   - 유저 기준 IDF: log(200/185) + 1 = 1.08  ← "거의 모두 소장, 구분력 없음"
        #                                                  올바르게 낮게 평가!
        #
        # 예) 레더(leather) 어코드
        #   - 향수 기준 IDF: log(1300/80) + 1  = 3.78
        #   - 유저 기준 IDF: log(200/25) + 1   = 3.08  ← 둘 다 높음, 방향 일치
        #
        # 두 IDF가 어긋나는 케이스가 바로 향수 기준 IDF의 오류 지점이다.
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

        # ── Step 6. 유저 TF × User-IDF 매트릭스 ──────────────────────────────
        self.user_accord_matrix = df_user_accord.pivot(
            index="member_id", columns="accord_id", values="tf"
        ).fillna(0)
        self.user_raw_count_matrix = df_user_accord.pivot(
            index="member_id", columns="accord_id", values="raw_count"
        ).fillna(0)

        idf_vector = np.array(
            [self.user_idf_dict.get(col, 1.0) for col in self.user_accord_matrix.columns]
        )
        self.tfidf_matrix = self.user_accord_matrix * idf_vector

        # ── Step 7. 향수 콘텐츠 벡터 (User-IDF 기반, L2 정규화) ──────────────
        #   향수 어코드는 0/1 바이너리 × User-IDF → L2 정규화
        #   → 유저 벡터(L2 정규화 후)와 내적 = 코사인 유사도
        perfume_binary = df_perfume_accord.assign(value=1).pivot_table(
            index="perfume_id", columns="accord_id", values="value", aggfunc="max"
        ).fillna(0)
        perfume_binary = perfume_binary.reindex(
            columns=self.user_accord_matrix.columns, fill_value=0
        )
        perfume_weighted = perfume_binary * idf_vector
        self.perfume_tfidf_matrix = pd.DataFrame(
            normalize(perfume_weighted.values, norm="l2"),
            index=perfume_weighted.index,
            columns=perfume_weighted.columns,
        )

        # ── Step 8. KNN 모델 학습 ─────────────────────────────────────────────
        self.knn_model = NearestNeighbors(metric="cosine", algorithm="brute")
        self.knn_model.fit(self.tfidf_matrix)

        print(
            f"✅ 로드 완료\n"
            f"   유저 {total_users}명 / "
            f"향수 {self.df_member_perfume['perfume_id'].nunique()}개 / "
            f"어코드 {len(self.user_accord_matrix.columns)}종\n"
        )

    # ──────────────────────────────────────────────────────────────────────────
    # 내부 헬퍼
    # ──────────────────────────────────────────────────────────────────────────

    def _dynamic_alpha(self, owned_count: int) -> float:
        """
        소장 수에 따라 CF ↔ 콘텐츠 비중을 자동 조절 (Cold-start 대응)

        소장이 적을수록 CF 신뢰도가 낮으므로 콘텐츠 비중을 높인다.
        소장이 많을수록 취향 데이터가 충분하므로 CF를 더 신뢰한다.
        """
        if owned_count <= 2:   return 0.0   # 콘텐츠 100%
        if owned_count <= 5:   return 0.3
        if owned_count <= 10:  return 0.6
        if owned_count <= 20:  return 0.8
        return 1.0                           # CF 100%

    def _rank_normalize(self, s: pd.Series) -> pd.Series:
        """
        Rank 기반 정규화 (MinMax 대체)

        MinMax의 문제: (score - min) / (max - min)
          → 후보 향수 중 1명 소장=0점, 5명 소장=1점이 되어버림
          → 실제 CF 가중합 크기 정보가 사라짐
          → k_neighbors가 작을수록 왜곡 심해짐

        Rank 방식: 순위를 0~1로 선형 변환
          → outlier 1개가 전체를 눌러버리는 현상 없음
          → 점수 분포가 어떻든 안정적
        """
        if s.empty or s.max() == 0:
            return pd.Series(0.0, index=s.index)
        ranks = s.rank(ascending=False, method="min")
        return (len(s) - ranks + 1) / len(s)

    def _content_scores(self, target_member_id: int, perfume_ids: list) -> pd.Series:
        """내 취향 벡터 × 향수 어코드 벡터 → 코사인 유사도"""
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

    def _matching_accords(
        self, target_member_id: int, perfume_id: int, top_n: int = 3
    ) -> list[str]:
        """내 취향과 이 향수가 공유하는 어코드 (User-IDF 점수 높은 순)"""
        if perfume_id not in self.perfume_tfidf_matrix.index:
            return []
        user_vec    = self.tfidf_matrix.loc[target_member_id]
        perfume_vec = self.perfume_tfidf_matrix.loc[perfume_id]
        match_ids   = user_vec.index[(user_vec > 0) & (perfume_vec > 0)].tolist()
        match_ids.sort(key=lambda aid: user_vec[aid], reverse=True)
        return [self.accord_dict.get(aid, f"?({aid})") for aid in match_ids[:top_n]]

    # ──────────────────────────────────────────────────────────────────────────
    # 메인 추천
    # ──────────────────────────────────────────────────────────────────────────

    def recommend_perfumes(
        self,
        target_member_id: int,
        k_neighbors: int = 10,
        top_n: int = 5,
    ) -> list[int]:
        if self.tfidf_matrix is None:
            raise ValueError("load_and_prepare_data()를 먼저 호출하세요.")

        if target_member_id not in self.tfidf_matrix.index:
            print(f"⚠️  유저 {target_member_id}의 소장 기록이 없습니다.")
            return []

        # ── 1. Dynamic alpha ──────────────────────────────────────────────────
        owned_count = len(
            self.df_member_perfume[
                self.df_member_perfume["member_id"] == target_member_id
            ]
        )
        alpha = self._dynamic_alpha(owned_count)

        # ── 2. 유저 취향 출력 ─────────────────────────────────────────────────
        tfidf_vec = self.tfidf_matrix.loc[target_member_id]
        raw_vec   = self.user_raw_count_matrix.loc[target_member_id]
        top_profile = tfidf_vec[tfidf_vec > 0].sort_values(ascending=False).head(7)

        print(f"{'='*70}")
        print(f"👤  유저 {target_member_id}  |  소장 {owned_count}개  "
              f"|  α={alpha}  (CF {alpha:.0%} / 콘텐츠 {1-alpha:.0%})")
        print(f"{'='*70}")
        print(f"  [취향 어코드 — BM25-TF × User-IDF]")
        print(f"  {'어코드':<20} {'소장':>5}  {'BM25-TF':>8}  {'User-IDF':>9}  {'최종점수':>9}")
        print(f"  {'-'*56}")
        for acc_id, score in top_profile.items():
            name    = self.accord_dict.get(acc_id, str(acc_id))
            raw     = int(raw_vec[acc_id])
            tf_val  = self.user_accord_matrix.loc[target_member_id, acc_id]
            idf_val = self.user_idf_dict.get(acc_id, 1.0)
            print(f"  {name:<20} {raw:>5}개  {tf_val:>8.3f}  {idf_val:>9.3f}  {score:>9.3f}")
        print()

        # ── 3. KNN — 유사 유저 탐색 ───────────────────────────────────────────
        n_neighbors_safe = min(k_neighbors + 1, len(self.tfidf_matrix))
        target_vector    = self.tfidf_matrix.loc[target_member_id].values.reshape(1, -1)
        distances, indices = self.knn_model.kneighbors(target_vector, n_neighbors=n_neighbors_safe)

        similar_users   = []
        similarities    = []
        print(f"  [유사 유저 Top-{k_neighbors}]")
        for i in range(1, len(indices[0])):
            uid = self.tfidf_matrix.index[indices[0][i]]
            sim = float(1 - distances[0][i])
            similar_users.append(uid)
            similarities.append(sim)
            print(f"    유저 {uid:>6}:  유사도 {sim:.1%}")
        print()

        # ── 4. [핵심 변경] 유사도 가중 CF 점수 ───────────────────────────────
        #
        # 기존: for pid in neighbor_owns: cf_score[pid] += 1
        # 개선: for pid in neighbor_owns: cf_score[pid] += similarity
        #
        # 유사도 90% 유저가 추천한 향수 > 유사도 50% 유저가 추천한 향수
        cf_scores: dict[int, float] = {}
        for uid, sim in zip(similar_users, similarities):
            neighbor_owns = self.df_member_perfume[
                self.df_member_perfume["member_id"] == uid
            ]["perfume_id"].tolist()
            for pid in neighbor_owns:
                cf_scores[pid] = cf_scores.get(pid, 0.0) + sim

        cf_series = pd.Series(cf_scores)

        # 내가 이미 소장한 향수 제외
        owned = set(
            self.df_member_perfume[
                self.df_member_perfume["member_id"] == target_member_id
            ]["perfume_id"]
        )
        cf_series = cf_series[~cf_series.index.isin(owned)]

        if cf_series.empty:
            print("  추천할 향수가 없습니다.")
            return []

        candidate_ids = cf_series.index.tolist()

        # ── 5. 콘텐츠 점수 ────────────────────────────────────────────────────
        content_scores = self._content_scores(target_member_id, candidate_ids)

        # ── 6. [핵심 변경] Rank 정규화 + 가중 혼합 ───────────────────────────
        cf_norm      = self._rank_normalize(cf_series.reindex(candidate_ids, fill_value=0.0))
        content_norm = self._rank_normalize(content_scores)
        hybrid       = (alpha * cf_norm + (1 - alpha) * content_norm).sort_values(ascending=False)
        top_ids      = hybrid.head(top_n).index.tolist()

        # ── 7. 향수 이름 조회 ─────────────────────────────────────────────────
        ids_sql  = ", ".join(str(pid) for pid in top_ids)
        df_names = pd.read_sql(
            f"SELECT perfume_id, perfume_name FROM public.perfume "
            f"WHERE perfume_id IN ({ids_sql}) AND is_delete = false;",
            self.engine,
        )
        name_map = dict(zip(df_names["perfume_id"], df_names["perfume_name"]))

        # ── 8. 결과 출력 ──────────────────────────────────────────────────────
        print(
            f"  [최종 추천]  CF(유사도가중) × {alpha}  +  콘텐츠(User-IDF) × {1-alpha}\n"
            f"  {'순위':<4} {'향수명':<35} {'CF가중합':>9} {'CF_rank':>8} "
            f"{'콘텐츠':>8} {'최종':>7}  매칭 어코드"
        )
        print(f"  {'-'*105}")
        for rank, pid in enumerate(top_ids, start=1):
            p_name    = name_map.get(pid, f"ID:{pid}")
            matched   = self._matching_accords(target_member_id, pid)
            match_str = ", ".join(matched) if matched else "─"
            print(
                f"  {rank:<4} {p_name:<35} "
                f"{cf_series.get(pid, 0):>9.3f} "
                f"{cf_norm.get(pid, 0):>8.3f} "
                f"{content_norm.get(pid, 0):>8.3f} "
                f"{hybrid.get(pid, 0):>7.3f}  "
                f"{match_str}"
            )
        print(f"  {'='*105}\n")
        return top_ids


# ══════════════════════════════════════════════════════════════════════════════
# 실행 / 비교 테스트
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":

    DB_URL = (
        f"postgresql+psycopg2://"
        f"{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}"
        f"/{os.getenv('DB_NAME')}"
    )

    TARGET_MEMBER_ID = 120   # ← 테스트할 유저 ID 변경

    # ── 신규 모델 실행 ────────────────────────────────────────────────────────
    print("\n" + "█"*70)
    print("  [NEW]  User-IDF + 유사도가중 CF + Rank 정규화")
    print("█"*70 + "\n")

    new_model = UserIdfRecommender(db_url=DB_URL)
    new_model.load_and_prepare_data()
    new_result = new_model.recommend_perfumes(
        target_member_id=TARGET_MEMBER_ID, k_neighbors=10, top_n=5
    )

    # ── IDF 비교 출력 (변경 1번 확인용) ─────────────────────────────────────
    #   어코드별로 향수 기준 IDF vs 유저 기준 IDF를 나란히 보여준다.
    #   두 값이 크게 어긋나는 어코드 = 기존 방식의 오류 지점
    print("█"*70)
    print("  [IDF 비교]  향수 기준 IDF  vs  유저 기준 IDF")
    print("  어긋나는 어코드 = 기존(향수 기준) IDF가 유저 구분을 잘못 평가한 것")
    print("█"*70)

    # 향수 기준 IDF 재계산 (비교용)
    df_perfume_accord_cmp = pd.read_sql(
        "SELECT perfume_id, accord_id FROM public.perfume_accord WHERE is_delete = false;",
        new_model.engine,
    )
    total_perfumes_cmp = df_perfume_accord_cmp["perfume_id"].nunique()
    perfume_idf_series = (
        df_perfume_accord_cmp.groupby("accord_id")["perfume_id"]
        .nunique()
        .apply(lambda df: np.log(total_perfumes_cmp / (1 + df)) + 1)
    )

    # 유저 기준 IDF
    user_idf_series = pd.Series(new_model.user_idf_dict)

    # 두 IDF를 합쳐서 차이 큰 순으로 정렬
    cmp_df = pd.DataFrame({
        "perfume_idf": perfume_idf_series,
        "user_idf":    user_idf_series,
    }).dropna()
    cmp_df["accord_name"] = cmp_df.index.map(new_model.accord_dict)
    cmp_df["diff"] = (cmp_df["perfume_idf"] - cmp_df["user_idf"]).abs()
    cmp_df = cmp_df.sort_values("diff", ascending=False).head(15)

    print(f"\n  {'어코드':<22} {'향수기준IDF':>11}  {'유저기준IDF':>11}  {'차이':>6}")
    print(f"  {'-'*56}")
    for _, row in cmp_df.iterrows():
        direction = "← 기존이 과대평가" if row["perfume_idf"] > row["user_idf"] else "← 기존이 과소평가"
        print(
            f"  {str(row['accord_name']):<22} "
            f"{row['perfume_idf']:>11.3f}  "
            f"{row['user_idf']:>11.3f}  "
            f"{row['diff']:>6.3f}  {direction}"
        )

    # ── BM25 Hybrid(기존) 실행 ────────────────────────────────────────────────
    print("\n\n" + "█"*70)
    print("  [OLD]  BM25 Hybrid (향수 기준 IDF + 단순 카운트 CF + MinMax)")
    print("█"*70 + "\n")

    import importlib.util, pathlib
    _spec = importlib.util.spec_from_file_location(
        "recommender_bm25",
        pathlib.Path(__file__).parent / "recommender_BM25.py",
    )
    _mod = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)

    old_model = _mod.HybridPerfumeRecommender(db_url=DB_URL, tf_method="bm25")
    old_model.load_and_prepare_data()
    old_result_dict = old_model.recommend_perfumes(
        target_member_id=TARGET_MEMBER_ID, k_neighbors=10, top_n=5
    )
    old_result = old_result_dict.get("top_ids", [])

    # ── 최종 비교 ─────────────────────────────────────────────────────────────
    print("\n" + "█"*70)
    print("  [결과 비교]")
    print("█"*70)
    print(f"  기존(BM25 Hybrid) 추천: {old_result}")
    print(f"  신규(User-IDF)    추천: {new_result}")
    overlap = set(old_result) & set(new_result)
    print(f"  공통 추천 향수   : {sorted(overlap)} ({len(overlap)}개)")
    print(
        f"\n  공통이 적을수록 IDF 기준 변경이 추천 결과에 실질적으로 영향을 준 것\n"
    )
