import os
import pandas as pd #csv파일을 표 형태로 읽기
import psycopg2 # python에서 postgres에 연결하는 드라이버
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# 변수 딕셔너리
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "bysuco_perfumes.csv")

# ㅡㅡㅡㅡㅡㅡㅡㅡ
# 2. 헬퍼함수
# ㅡㅡㅡㅡㅡㅡㅡㅡ

def parse_list(value):
    # isna : 값이 비어있는지 확인
    if pd.isna(value) or str(value).strip() =="":
        return []
    # strip : 공백제거
    return [item.strip() for item in str(value).split(",") if item.strip()]


# conn: DB와의 연결 통로
# cursor: SQL을 실행하는 펜
def get_or_create_accord(cursor,accord_name, accord_cache):
    # 어코드 이름이 캐시에 있는 지 확인
    if accord_name in accord_cache:   
        return accord_cache[accord_name]
    
    # db에 있는지 확인
    cursor.execute(
        "SELECT accord_id FROM accord WHERE accord_name =%s AND is_delete=false",
        (accord_name,)
    )
    row= cursor.fetchone() # 결과 꺼내기

    if row:
        accord_cache[accord_name] = row[0]
    else:
        #RETURNING: postgresSQL 전용 문법, 방금만든 행의 ID를 RETURN
        cursor.execute(
            """
            INSERT INTO accord(accord_name, create_time, modify_time, is_delete)
            VALUES (%s, %s, %s, false)
            RETURNING accord_id
            """,
            (accord_name, datetime.now(), datetime.now())
        )
        # 딕셔너리 접근이라 대괄호
        accord_cache[accord_name] = cursor.fetchone()[0]

    return accord_cache[accord_name]

def get_or_create_note(cursor, note_name, note_cache) :
    if note_name in note_cache:
        return note_cache[note_name]
    
    cursor.execute(
        "SELECT note_id FROM note WHERE note_name = %s AND is_delete = false",
        (note_name,)
    )
    row=cursor.fetchone()

    if row:
        note_cache[note_name] = row[0]
    else:
        cursor.execute(
            """
            INSERT INTO note (note_name, create_time, modify_time, is_delete)
            VALUES (%s, %s,%s, false)
            RETURNING note_id
            """,
            (note_name, datetime.now(), datetime.now())
        )
        note_cache[note_name] = cursor.fetchone()[0]

    return note_cache[note_name]

def main():
    df=pd.read_csv(CSV_PATH) # 파일 읽기
    print(f"csv 로그 완료:{len(df)}개 향수")

    # db연결
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    print("DB연결 완료")

    accord_cache ={}
    note_cache = {}

    success_count = 0
    error_count=  0

    for idx, row in df.iterrows():
        try:
            cursor.execute(
                """
                INSERT INTO perfume
                    (image_route, perfume_name, brand, description, url, price,
                    create_time, modify_time, is_delete)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,false)
                RETURNING perfume_id
                """,
                (
                    row.get("image_route"),
                    row.get("name"),
                    row.get("brand"),
                    row.get("description"),
                    row.get("url"),
                    row.get("price"),
                    datetime.now(),
                    datetime.now(),
                )
            )
            perfume_id = cursor.fetchone()[0]

            accords = parse_list(row.get("accords"))
            for order, accord_name in enumerate(accords, start=1):
                accord_id = get_or_create_accord(cursor, accord_name, accord_cache)
                cursor.execute(
                    """
                    INSERT INTO perfume_accord
                        (accord_id, perfume_id, accord_order, create_time, modify_time, is_delete)
                    VALUES (%s, %s,%s,%s,%s,false)
                    """,
                    (accord_id, perfume_id, order, datetime.now(), datetime.now())
                )
            
            top_notes    = parse_list(row.get("top_notes"))
            middle_notes = parse_list(row.get("middle_notes"))
            base_notes   = parse_list(row.get("base_notes"))

            # 탑/미들/베이스가 모두 있을 때만 레벨 구분, 하나라도 없으면 SINGLE
            if top_notes and middle_notes and base_notes:
                note_levels = {
                    "TOP": top_notes,
                    "MIDDLE": middle_notes,
                    "BASE": base_notes,
                }
            else:
                all_notes = top_notes + middle_notes + base_notes
                note_levels = {"SINGLE": all_notes}

            for level, notes in note_levels.items():
                for note_name in notes:
                    note_id =get_or_create_note(cursor, note_name, note_cache)
                    cursor.execute(
                        """
                        INSERT INTO perfume_note
                            (perfume_id,note_id, note_level,create_time, modify_time, is_delete)
                        VALUES (%s,%s,%s,%s,%s,false)
                        """,
                        (perfume_id, note_id, level, datetime.now(), datetime.now())
                    )
            success_count +=1

            if success_count % 100 == 0:
                conn.commit()
                print(f" {success_count}개 처리 완료...")

        except Exception as e:
            print(f"{idx}번 행 오류 ({row.get('name')}):{e}")
            conn.rollback() # 이 한 행만 실행 취소
            accord_cache.clear()  # rollback으로 무효화된 ID가 캐시에 남지 않도록
            note_cache.clear()
            error_count+=1

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\n 완료! 성공{success_count}개/ 실패: {error_count}개")

if __name__ == "__main__":
    main()