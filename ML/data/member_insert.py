"""
향기록 - 협업 필터링 테스트용 더미 데이터 생성기
=================================================
실행 방법:
  python generate_test_data.py

필요한 패키지:
  pip install psycopg2-binary

이 스크립트가 하는 일:
  1. DB에서 어코드별 향수 목록을 읽어옴
  2. 취향 그룹 6개를 정의 (플로럴파, 우디파, 시트러스파 등)
  3. 가짜 유저 200명 생성 (각자 1~2개 취향 그룹에 배정)
  4. 취향 그룹에 따라 편향된 좋아요 데이터 생성
  5. INSERT SQL 파일로 출력
"""

import os
import psycopg2
import random
import hashlib
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# [설정] .env 파일에서 자동으로 읽어옴 (app/db/database.py와 동일 패턴)
# ============================================================
DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 5432)),
    "dbname":   os.getenv("DB_NAME"),
    "user":     os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

NUM_USERS = 200          # 생성할 유저 수
MIN_LIKES = 5            # 유저당 최소 좋아요 수
MAX_LIKES = 25           # 유저당 최대 좋아요 수
OWN_GROUP_PROB = 0.70    # 자기 취향 그룹 향수를 좋아요할 확률
OUTPUT_FILE = "dummy_data.sql"

# ============================================================
# [취향 그룹 정의]
# 각 그룹에 해당하는 어코드 이름 키워드를 적어둠
# DB의 accord_name에 이 키워드가 포함되면 해당 그룹으로 분류
# ============================================================
TASTE_GROUPS = {
    "floral": {
        # 꽃향 계열
        "accords": ["플로럴", "옐로우 플로럴", "화이트 플로럴"],
        "description": "플로럴 취향 - 꽃향 좋아하는 유저"
    },
    "woody": {
        # 나무/숲 계열
        "accords": ["우디", "스모키", "모씨", "인센스", "솔"],
        "description": "우디 취향 - 나무/숲 향 좋아하는 유저"
    },
    "citrus_fresh": {
        # 상큼하고 시원한 계열
        "accords": ["시트러스", "프레시", "아쿠아틱", "오조닉", "그린"],
        "description": "시트러스/프레시 취향 - 상큼하고 시원한 향"
    },
    "sweet": {
        # 달콤한 계열
        "accords": ["스위트", "구르망", "바닐라", "프루티", "락토닉"],
        "description": "스위트 취향 - 달콤한 향 좋아하는 유저"
    },
    "spicy_oriental": {
        # 향신료/동양적 계열
        "accords": ["오리엔탈", "웜 스파이시", "프레시 스파이시", "소프트 스파이시", "앰버"],
        "description": "스파이시/오리엔탈 취향 - 깊고 이국적인 향"
    },
    "musky_powdery": {
        # 포근하고 따뜻한 계열
        "accords": ["머스키", "파우더리", "알데하이드"],
        "description": "머스키/파우더리 취향 - 포근하고 따뜻한 향"
    },
}


def connect_db():
    """PostgreSQL 연결"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("DB 연결 성공!")
        return conn
    except Exception as e:
        print(f"DB 연결 실패: {e}")
        print("DB_CONFIG 설정을 확인해주세요.")
        exit(1)


def load_accord_perfume_mapping(conn):
    """
    DB에서 어코드별 향수 목록을 가져옴
    
    반환값 예시:
    {
        "floral": [10, 23, 45, ...],   ← 플로럴 어코드를 가진 향수 id 목록
        "woody":  [5, 12, 88, ...],
        ...
    }
    """
    cursor = conn.cursor()
    
    # 1) 먼저 어코드 전체 목록을 가져옴
    cursor.execute("""
        SELECT a.accord_id, a.accord_name
        FROM accord a
        WHERE a.is_delete = false
    """)
    all_accords = cursor.fetchall()
    print(f"\n전체 어코드 수: {len(all_accords)}개")
    
    # 2) 각 어코드를 취향 그룹에 매핑
    #    accord_name이 그룹의 accords 리스트에 정확히 일치하면 해당 그룹으로 분류
    accord_to_group = {}  # accord_id → group_name
    
    for accord_id, accord_name in all_accords:
        name_stripped = accord_name.strip() if accord_name else ""
        for group_name, group_info in TASTE_GROUPS.items():
            if name_stripped in group_info["accords"]:
                accord_to_group[accord_id] = group_name
                break
    
    print(f"그룹에 매핑된 어코드 수: {len(accord_to_group)}개")
    
    # 매핑 안 된 어코드 확인 (참고용)
    unmapped = [(aid, aname) for aid, aname in all_accords if aid not in accord_to_group]
    if unmapped:
        print(f"그룹에 매핑 안 된 어코드 {len(unmapped)}개 (기타로 처리):")
        for aid, aname in unmapped[:10]:  # 10개만 출력
            print(f"  - {aname} (id: {aid})")
        if len(unmapped) > 10:
            print(f"  ... 외 {len(unmapped) - 10}개")
    
    # 3) 그룹별 향수 목록 구성
    group_perfumes = {group: set() for group in TASTE_GROUPS}
    
    cursor.execute("""
        SELECT pa.accord_id, pa.perfume_id
        FROM perfume_accord pa
        JOIN perfume p ON pa.perfume_id = p.perfume_id
        WHERE pa.is_delete = false AND p.is_delete = false
    """)
    
    for accord_id, perfume_id in cursor.fetchall():
        group = accord_to_group.get(accord_id)
        if group:
            group_perfumes[group].add(perfume_id)
    
    # set → list로 변환
    group_perfumes = {g: list(pids) for g, pids in group_perfumes.items()}
    
    print("\n=== 취향 그룹별 향수 수 ===")
    for group, pids in group_perfumes.items():
        desc = TASTE_GROUPS[group]["description"]
        print(f"  {group:10s} → {len(pids):4d}개 향수  ({desc})")
    
    # 4) 전체 향수 목록도 가져옴 (기타 그룹용)
    cursor.execute("SELECT perfume_id FROM perfume WHERE is_delete = false")
    all_perfume_ids = [row[0] for row in cursor.fetchall()]
    print(f"\n전체 향수 수: {len(all_perfume_ids)}개")
    
    cursor.close()
    return group_perfumes, all_perfume_ids


def generate_members(num_users):
    """
    가짜 유저 데이터 생성
    
    각 유저에게 1~2개의 취향 그룹을 배정
    
    반환값: [
        {
            "id": "user_001",
            "password": "해시된비밀번호",
            "birth_year": 1998,
            "gender": "FEMALE",
            "nickname": "향수러버_001",
            "taste_groups": ["floral", "sweet"],  ← 이 유저의 취향
        },
        ...
    ]
    """
    members = []
    group_names = list(TASTE_GROUPS.keys())
    
    for i in range(1, num_users + 1):
        # 1~2개의 취향 그룹 랜덤 배정
        num_groups = random.choice([1, 1, 1, 2])  # 75%는 1개, 25%는 2개
        taste = random.sample(group_names, num_groups)
        
        # 비밀번호는 간단하게 해시 (실제 로그인 안 할 더미 데이터)
        raw_pw = f"test1234_{i}"
        hashed_pw = hashlib.sha256(raw_pw.encode()).hexdigest()[:60]
        
        member = {
            "id": f"dummy_user_{i:03d}",
            "password": hashed_pw,
            "birth_year": random.randint(1985, 2005),
            "gender": random.choice(["MALE", "FEMALE"]),
            "nickname": f"향기유저_{i:03d}",
            "taste_groups": taste,
        }
        members.append(member)
    
    # 취향 분포 출력
    print("\n=== 유저 취향 그룹 분포 ===")
    group_count = {g: 0 for g in group_names}
    for m in members:
        for g in m["taste_groups"]:
            group_count[g] += 1
    for g, cnt in group_count.items():
        print(f"  {g:10s} → {cnt:3d}명")
    
    return members


def generate_likes(members, group_perfumes, all_perfume_ids):
    """
    취향 그룹에 따라 편향된 좋아요 데이터 생성
    
    원리:
    - 유저의 취향 그룹에 속한 향수 → 높은 확률로 좋아요
    - 취향 그룹 밖 향수 → 낮은 확률로 좋아요
    
    이렇게 해야 TF-IDF 벡터에서 유저 간 취향 차이가 드러남
    """
    all_likes = []  # [(member_index, perfume_id), ...]
    
    for idx, member in enumerate(members):
        # 이 유저가 좋아요할 향수 개수 (5~25개)
        num_likes = random.randint(MIN_LIKES, MAX_LIKES)
        
        # 이 유저의 취향 그룹에 속한 향수 모으기
        my_perfumes = set()
        for group in member["taste_groups"]:
            my_perfumes.update(group_perfumes.get(group, []))
        my_perfumes = list(my_perfumes)
        
        # 취향 밖 향수
        other_perfumes = [pid for pid in all_perfume_ids if pid not in my_perfumes]
        
        liked = set()
        for _ in range(num_likes):
            # OWN_GROUP_PROB 확률로 자기 그룹에서, 나머지는 기타에서
            if random.random() < OWN_GROUP_PROB and my_perfumes:
                pid = random.choice(my_perfumes)
            else:
                pid = random.choice(other_perfumes) if other_perfumes else random.choice(all_perfume_ids)
            liked.add(pid)
        
        for pid in liked:
            all_likes.append((idx, pid))
    
    print(f"\n총 좋아요 수: {len(all_likes)}개")
    print(f"유저당 평균: {len(all_likes) / len(members):.1f}개")
    
    return all_likes


def write_sql(members, all_likes, output_file):
    """
    SQL INSERT 문으로 출력
    
    member → likes 순서로 INSERT
    member_id는 GENERATED ALWAYS이므로 직접 넣지 않음
    대신 currval로 방금 생성된 member_id를 참조
    """
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("-- =============================================\n")
        f.write("-- 향기록 협업 필터링 테스트용 더미 데이터\n")
        f.write(f"-- 생성일: {now}\n")
        f.write(f"-- 유저 수: {len(members)}명\n")
        f.write(f"-- 좋아요 수: {len(all_likes)}개\n")
        f.write("-- =============================================\n\n")
        
        # ── 1) Member INSERT ──
        f.write("-- ============ MEMBER INSERT ============\n")
        f.write("-- 주의: member_id는 자동 생성 (GENERATED ALWAYS)\n")
        f.write("-- 기존 데이터가 있다면 member_id 시작값 확인 필요\n\n")
        
        for member in members:
            # SQL 인젝션 방지: 작은따옴표 이스케이프
            m_id = member["id"].replace("'", "''")
            m_pw = member["password"].replace("'", "''")
            m_nick = member["nickname"].replace("'", "''")
            
            f.write(
                f"INSERT INTO member (id, password, birth_year, gender, nickname, create_time, is_delete) "
                f"VALUES ('{m_id}', '{m_pw}', {member['birth_year']}, "
                f"'{member['gender']}', '{m_nick}', '{now}', false);\n"
            )
        
        f.write(f"\n-- 방금 넣은 {len(members)}명의 member_id 범위 확인\n")
        f.write("-- SELECT member_id, id FROM member WHERE id LIKE 'dummy_user_%' ORDER BY member_id;\n\n")
        
        # ── 2) Likes INSERT ──
        # member_id를 알아야 하므로, 서브쿼리로 id → member_id 매핑
        f.write("-- ============ LIKES INSERT ============\n")
        f.write("-- member.id로 member_id를 조회해서 넣음\n\n")
        
        for member_idx, perfume_id in all_likes:
            member_login_id = members[member_idx]["id"].replace("'", "''")
            f.write(
                f"INSERT INTO likes (member_id, perfume_id, create_time, is_delete) "
                f"VALUES ("
                f"(SELECT member_id FROM member WHERE id = '{member_login_id}'), "
                f"{perfume_id}, '{now}', false);\n"
            )
        
        # ── 3) 소장 향수 (member_perfume) ──
        # 좋아요 중 일부를 소장 향수로도 넣어줌 (30% 확률)
        f.write("\n-- ============ MEMBER_PERFUME (소장) INSERT ============\n")
        f.write("-- 좋아요 한 향수 중 30%를 소장 향수로도 등록\n\n")
        
        own_count = 0
        for member_idx, perfume_id in all_likes:
            if random.random() < 0.30:  # 30% 확률로 소장
                member_login_id = members[member_idx]["id"].replace("'", "''")
                f.write(
                    f"INSERT INTO member_perfume (member_id, perfume_id, create_time, is_delete) "
                    f"VALUES ("
                    f"(SELECT member_id FROM member WHERE id = '{member_login_id}'), "
                    f"{perfume_id}, '{now}', false);\n"
                )
                own_count += 1
        
        f.write(f"\n-- 소장 향수 총 {own_count}개 생성\n")
    
    print(f"\n✅ SQL 파일 생성 완료: {output_file}")
    print(f"   - Member: {len(members)}개 INSERT")
    print(f"   - Likes: {len(all_likes)}개 INSERT")
    print(f"   - Member_Perfume (소장): {own_count}개 INSERT")


def main():
    print("=" * 50)
    print("향기록 - 더미 데이터 생성기")
    print("=" * 50)
    
    # 1) DB 연결 & 어코드-향수 매핑 로드
    conn = connect_db()
    group_perfumes, all_perfume_ids = load_accord_perfume_mapping(conn)
    conn.close()
    
    # 비어있는 그룹 체크
    empty_groups = [g for g, pids in group_perfumes.items() if len(pids) == 0]
    if empty_groups:
        print(f"\n⚠️  주의: 다음 그룹에 향수가 0개입니다: {empty_groups}")
        print("   TASTE_GROUPS의 keywords를 DB의 어코드 이름에 맞게 수정해주세요.")
        print("   DB의 어코드 목록 확인: SELECT accord_name FROM accord;")
    
    # 2) 유저 생성
    members = generate_members(NUM_USERS)
    
    # 3) 좋아요 생성
    all_likes = generate_likes(members, group_perfumes, all_perfume_ids)
    
    # 4) SQL 파일 출력
    write_sql(members, all_likes, OUTPUT_FILE)
    
    print(f"\n사용법:")
    print(f"  psql -U [유저] -d [DB이름] -f {OUTPUT_FILE}")
    print(f"  또는 DBeaver에서 {OUTPUT_FILE} 열어서 실행")


if __name__ == "__main__":
    main()