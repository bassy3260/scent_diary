FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && rm -rf /root/.cache/pip

# 모델 미리 다운로드 (이미지 빌드 시 캐싱)
RUN python -c "\
import torch; \
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('BAAI/bge-m3', model_kwargs={'torch_dtype': torch.float16})"

COPY handler.py .

CMD ["python", "handler.py"]
