"""
PL-Insight Dashboard — FastAPI AI Server
Serves PhoBERT model for Vietnamese sentiment analysis.
"""

import os
import torch
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from preprocessor import PLPreprocessor

# ── Load environment ──
load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "./model")

# ── FastAPI app ──
app = FastAPI(
    title="PL-Insight AI Server",
    description="PhoBERT Sentiment Analysis API for Phuc Long reviews",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global model state ──
model = None
tokenizer = None
preprocessor = PLPreprocessor()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

LABEL_MAP = {0: "Negative", 1: "Positive"}


# ── Pydantic schemas ──
class PredictRequest(BaseModel):
    text: str


class PredictBatchRequest(BaseModel):
    reviews: list[dict]


class SentenceResult(BaseModel):
    sentence: str
    label: int
    label_name: str
    aspect: str | None = None
    score: float


class PredictResponse(BaseModel):
    review_text: str
    sentiment_summary: str
    confidence_avg: float
    analysis: list[SentenceResult]
    keywords: list[str]


# ── Model loading ──
@app.on_event("startup")
async def load_model():
    """Load PhoBERT model and tokenizer on server startup."""
    global model, tokenizer

    model_path = Path(MODEL_PATH)
    if not model_path.exists():
        print(f"⚠️  Model path '{MODEL_PATH}' not found. Endpoints will return errors.")
        return

    print(f"🔄 Loading PhoBERT model from {model_path}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(str(model_path))
        model = AutoModelForSequenceClassification.from_pretrained(str(model_path))
        model.to(device)
        model.eval()
        print(f"✅ Model loaded on {device} successfully!")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")


# ── Inference helper ──
def predict_sentence(text: str) -> tuple[int, float]:
    """Run PhoBERT inference on a single preprocessed sentence."""
    if model is None or tokenizer is None:
        raise RuntimeError("Model not loaded")

    inputs = tokenizer(
        text,
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=256,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)
        label = torch.argmax(probs, dim=-1).item()
        confidence = probs[0][label].item()

    return label, confidence


# ── API Endpoints ──
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "device": str(device),
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Predict sentiment for a single review.
    The review is split into sentences, each analyzed independently.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    raw_text = request.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Empty text")

    # Preprocess: split into sentences, clean, word-segment
    processed = preprocessor.process_for_inference(raw_text)

    if not processed:
        return PredictResponse(
            review_text=raw_text,
            sentiment_summary="Unknown",
            confidence_avg=0.0,
            analysis=[],
            keywords=[],
        )

    analysis = []
    all_keywords = []
    labels_seen = set()

    for item in processed:
        segmented = item["processed_sentence"]
        label, score = predict_sentence(segmented)
        labels_seen.add(label)

        # Primary aspect
        aspects = item.get("detected_aspects", [])
        primary_aspect = aspects[0] if aspects else None

        analysis.append(SentenceResult(
            sentence=item["original_sentence"],
            label=label,
            label_name=LABEL_MAP[label],
            aspect=primary_aspect,
            score=round(score, 4),
        ))

        # Collect keywords
        kws = preprocessor.extract_keywords(segmented)
        all_keywords.extend(kws)

    # Determine overall sentiment summary
    if len(labels_seen) == 1:
        sentiment_summary = LABEL_MAP[labels_seen.pop()]
    else:
        sentiment_summary = "Mixed"

    confidence_avg = round(
        float(np.mean([s.score for s in analysis])), 4
    )

    return PredictResponse(
        review_text=raw_text,
        sentiment_summary=sentiment_summary,
        confidence_avg=confidence_avg,
        analysis=analysis,
        keywords=list(set(all_keywords)),
    )


@app.post("/predict-batch")
async def predict_batch(request: PredictBatchRequest):
    """Predict sentiment for multiple reviews in a batch."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    results = []
    for review in request.reviews:
        text = review.get("text", "")
        review_id = review.get("review_id", "unknown")

        if not text or text == "Không có bình luận":
            results.append({
                "review_id": review_id,
                "sentiment_summary": "No Content",
                "confidence_avg": 0.0,
                "analysis": [],
                "keywords": [],
            })
            continue

        try:
            pred_request = PredictRequest(text=text)
            prediction = await predict(pred_request)
            results.append({
                "review_id": review_id,
                **prediction.model_dump(),
            })
        except Exception as e:
            results.append({
                "review_id": review_id,
                "error": str(e),
            })

    return {"results": results, "total": len(results)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
