import base64
import io

import numpy as np
import open_clip
import torch
from fastapi import FastAPI
from PIL import Image
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

# ============================================================
# 무드별 변형 라벨 (FashionSigLIP 앙상블용)
# ============================================================
MOOD_LABEL_VARIANTS = {
    "캐주얼/데일리": [
        "basic cotton t-shirt with blue denim jeans and white sneakers",
        "simple striped shirt with khaki chino pants and canvas shoes",
        "plain hoodie with comfortable jogger pants and slip-on shoes",
        "crewneck sweatshirt with straight fit jeans and loafers",
        "polo shirt with shorts and casual sandals",
    ],
    "스트릿/힙": [
        "oversized black hoodie with cargo pants and chunky sneakers",
        "graphic print t-shirt with baggy jeans and high-top sneakers",
        "bomber jacket with wide leg pants and retro sneakers",
        "oversized flannel shirt with ripped jeans and skateboard shoes",
        "hip-hop style tracksuit with gold chain and basketball shoes",
    ],
    "미니멀/모던": [
        "monochrome black and white outfit with clean tailored silhouette",
        "plain white shirt with black slim trousers and minimal accessories",
        "beige turtleneck with grey wool coat and white sneakers",
        "all black ensemble with structured blazer and simple leather bag",
        "neutral tone knit sweater with tailored wide pants",
    ],
    "로맨틱/페미닌": [
        "pastel pink floral dress with ribbon details and soft fabric",
        "light chiffon blouse with pleated midi skirt and pearl earrings",
        "lavender knit cardigan with white lace dress and ballet flats",
        "soft pink ruffle blouse with beige a-line skirt",
        "flowy maxi dress with delicate floral pattern and straw hat",
    ],
    "포멀/클래식": [
        "navy blue suit with white dress shirt and leather oxford shoes",
        "charcoal grey blazer with dress pants and silk tie",
        "double breasted coat with turtleneck and tailored trousers",
        "black formal suit with crisp white shirt and polished shoes",
        "tweed jacket with wool slacks and leather briefcase",
    ],
    "스포티/액티브": [
        "athletic leggings with sports bra and running shoes",
        "track jacket with jogger pants and athletic sneakers",
        "dry-fit polo shirt with tennis skirt and sport shoes",
        "windbreaker jacket with compression tights and trail shoes",
        "gym tank top with basketball shorts and cross-training shoes",
    ],
    "보헤미안/내추럴": [
        "loose linen blouse with long flowy skirt in earth tone colors",
        "crochet vest with wide leg pants and leather sandals",
        "tie-dye maxi dress with fringe bag and wooden accessories",
        "oversized cotton shirt with linen pants and woven belt",
        "embroidered tunic with harem pants and beaded jewelry",
    ],
    "시크/엣지": [
        "black leather jacket with skinny jeans and ankle boots",
        "all black outfit with biker jacket and combat boots",
        "dark leather pants with studded belt and black turtleneck",
        "black blazer with chain accessories and pointed boots",
        "distressed denim jacket with black ripped jeans and harness belt",
    ],
    "럭셔리/글램": [
        "silk satin evening dress with gold jewelry and high heels",
        "sequin embellished gown with diamond earrings and clutch bag",
        "fur coat with designer handbag and stiletto heels",
        "velvet blazer with silk blouse and statement necklace",
        "metallic dress with crystal accessories and designer pumps",
    ],
    "큐트/걸리시": [
        "pink mini skirt with ribbon bow top and pastel colored accessories",
        "plaid school-style skirt with knit vest and mary jane shoes",
        "denim overalls with striped t-shirt and colorful sneakers",
        "puff sleeve blouse with corduroy mini skirt and hair clips",
        "pastel hoodie with pleated skirt and platform sneakers",
    ],
}

# ============================================================
# 모델 로딩 (서버 시작 시 1회 실행)
# ============================================================
print("BAAI/bge-m3 모델 로딩 중...")
embed_model = SentenceTransformer("BAAI/bge-m3", model_kwargs={"torch_dtype": torch.float16})
embed_model.eval()
print("BAAI/bge-m3 모델 로딩 완료!")

print("FashionSigLIP 모델 로딩 중...")
clip_model, _, preprocess_val = open_clip.create_model_and_transforms(
    "hf-hub:Marqo/marqo-fashionSigLIP"
)
tokenizer = open_clip.get_tokenizer("hf-hub:Marqo/marqo-fashionSigLIP")
clip_model.eval()
print("FashionSigLIP 모델 로딩 완료!")

# 무드별 평균 임베딩 사전 계산
mood_embeddings: dict[str, torch.Tensor] = {}
with torch.no_grad():
    for mood, variants in MOOD_LABEL_VARIANTS.items():
        text_tokens = tokenizer(variants)
        features = clip_model.encode_text(text_tokens)
        features = features / features.norm(dim=-1, keepdim=True)
        mean_emb = features.mean(dim=0)
        mood_embeddings[mood] = mean_emb / mean_emb.norm()

print(f"무드 임베딩 계산 완료! ({len(mood_embeddings)}개 무드)")

# ============================================================
# FastAPI 서버
# ============================================================
app = FastAPI()


class EmbedRequest(BaseModel):
    text: str


class MoodRequest(BaseModel):
    image_base64: str
    temperature: float = 15.0


@app.post("/embed")
def embed(req: EmbedRequest) -> dict:
    with torch.no_grad():
        embedding = embed_model.encode(req.text, normalize_embeddings=True)
    return {"embedding": embedding.tolist()}


@app.post("/mood")
def mood(req: MoodRequest) -> dict:
    image_bytes = base64.b64decode(req.image_base64)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_tensor = preprocess_val(image).unsqueeze(0)

    with torch.no_grad():
        image_features = clip_model.encode_image(image_tensor)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)

        similarities = {
            mood_name: (image_features @ emb.unsqueeze(-1)).item()
            for mood_name, emb in mood_embeddings.items()
        }

    labels = list(similarities.keys())
    scores = np.array(list(similarities.values()))
    probs = np.exp(scores * req.temperature) / np.exp(scores * req.temperature).sum()

    return {"mood_scores": dict(zip(labels, probs.tolist()))}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
