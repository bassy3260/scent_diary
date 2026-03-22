import runpod
import torch
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-m3", model_kwargs={"torch_dtype": torch.float16})
model.eval()


def handler(job):
    job_input = job["input"]
    text = job_input.get("text", "")

    with torch.no_grad():
        embedding = model.encode(text, normalize_embeddings=True)

    return {"embedding": embedding.tolist()}


runpod.serverless.start({"handler": handler})
