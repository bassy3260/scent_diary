from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def recommend_perfumes(user_text: str, perfumes:list, top_k:int =5):
   # 향수 하나에 대한 텍스트 만들기
    corpus = []
    for p in perfumes:
        # filter(None, 리스트) 는 리스트에서 falsy한 값을 제거
        # None을 미리 제거한다.
        if(p["single_notes"] is None):
            notes = " ".join(filter(None, [p["top_notes"],p["middle_notes"],p["base_notes"]]))
        else :
            notes = p["single_notes"]
        text= " ".join(filter(None,[p["perfume_name"],p["accords"],notes,p["description"]]))
        corpus.append(text)

    # 벡터화
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)

    user_vector = vectorizer.transform([user_text])

    # 유사도 계산
    scores = cosine_similarity(user_vector,tfidf_matrix)[0]
    top_indices = scores.argsort()[::-1][:top_k]
    return [{**perfumes[i],"score":float(scores[i])} for i in top_indices]
