FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && rm -rf /root/.cache/pip

# 모델 미리 다운로드 (이미지 빌드 시 캐싱)
RUN python -c "\
import open_clip; \
open_clip.create_model_and_transforms('hf-hub:Marqo/marqo-fashionSigLIP'); \
open_clip.get_tokenizer('hf-hub:Marqo/marqo-fashionSigLIP')"

# 런타임에서는 HF Hub 네트워크 요청 차단 (캐시만 사용)
ENV HF_HUB_OFFLINE=1

COPY handler.py .

CMD ["python", "handler.py"]
