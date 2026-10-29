"""
PL-Insight Dashboard — FastAPI AI Server
Serves PhoBERT model for Vietnamese sentiment analysis.

JSON Contract: see implementation_plan.md §4 (Locked API Contracts)
Error Contract: { "error": { "code": str, "message": str, "details": str|null } }
"""

import os
import torch
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from preprocessor import PLPreprocessor

# ── Load environment ──
load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "./model")
MAX_BATCH_SIZE = 50

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


# ── Standardized error handler ──
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"ERR_{exc.status_code}",
                "message": exc.detail,
                "details": None,
            }
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "ERR_INTERNAL",
                "message": "Internal server error",
                "details": str(exc),
            }
        },
    )


# ── Global model state ──
model = None
tokenizer = None
is_mock_mode = False
preprocessor = PLPreprocessor()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

LABEL_MAP = {0: "Negative", 1: "Positive"}


# ── Pydantic schemas (camelCase per locked contract §2) ──
class PredictRequest(BaseModel):
    """Request body for POST /predict"""
    reviewText: str = Field(..., min_length=1, max_length=2000)


class SentenceResult(BaseModel):
    sentence: str
    label: int
    labelName: str
    aspectHint: str | None = None
    score: float


class PredictResponse(BaseModel):
    """Response body for POST /predict — matches locked contract §4"""
    reviewText: str
    sentimentSummary: str
    confidenceAvg: float
    analysis: list[SentenceResult]
    keywords: list[str]
    isTranslated: bool


class BatchReviewItem(BaseModel):
    reviewId: str = "unknown"
    reviewText: str = ""


class PredictBatchRequest(BaseModel):
    """Request body for POST /predict-batch"""
    reviews: list[BatchReviewItem] = Field(..., max_length=MAX_BATCH_SIZE)


def mock_predict_sentence(text: str) -> tuple[int, float]:
    """Deterministic rule-based sentiment fallback when PhoBERT weights are absent."""
    lower = text.lower()
    negative_cues = ["tệ", "dở", "chậm", "kém", "bẩn", "thất vọng", "đắt", "ồn", "thái độ", "lâu", "chờ", "khó chịu", "kinh khủng", "chán", "không ngon", "không tốt"]
    positive_cues = ["ngon", "tốt", "nhanh", "sạch", "thích", "tuyệt", "chu đáo", "hài lòng", "đẹp", "ổn", "ok", "đậm đà", "thơm", "thân thiện"]

    neg_hits = sum(1 for w in negative_cues if w in lower)
    pos_hits = sum(1 for w in positive_cues if w in lower)

    if neg_hits > pos_hits:
        return 0, min(round(0.85 + (neg_hits * 0.03), 4), 0.985)
    elif pos_hits > 0:
        return 1, min(round(0.88 + (pos_hits * 0.02), 4), 0.992)
    else:
        return 1, 0.8450


# ── Model loading ──
@app.on_event("startup")
async def load_model():
    """Load PhoBERT model and tokenizer on server startup with graceful mock fallback."""
    global model, tokenizer, is_mock_mode

    model_path = Path(MODEL_PATH)
    if not model_path.exists():
        is_mock_mode = True
        print("\n" + "=" * 60)
        print(f"[NOTICE] Model path '{MODEL_PATH}' not found.")
        print("Activating MOCK / SYNTHETIC INFERENCE MODE for local testing.")
        print(f"To enable PhoBERT, place model weights in '{MODEL_PATH}'.")
        print("=" * 60 + "\n")
        return

    print(f"Loading PhoBERT model from {model_path}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(str(model_path))
        model = AutoModelForSequenceClassification.from_pretrained(str(model_path))
        model.to(device)
        model.eval()
        is_mock_mode = False
        print(f"Model loaded on {device} successfully!")
    except Exception as e:
        is_mock_mode = True
        print(f"Failed to load model: {e}. Falling back to MOCK INFERENCE MODE.")


# ── Inference helper ──
def predict_sentence(text: str) -> tuple[int, float]:
    """Run PhoBERT inference or mock inference on a single preprocessed sentence."""
    if is_mock_mode:
        return mock_predict_sentence(text)

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
        "modelLoaded": model is not None,
        "mockMode": is_mock_mode,
        "device": str(device),
        "version": "1.0.0",
        "notice": "Production PhoBERT weights active." if not is_mock_mode else "Running in MOCK INFERENCE mode (synthetic predictions). Place weights in ./model for production PhoBERT.",
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Predict sentiment for a single review.
    The review is split into sentences (max 10), each analyzed independently.
    Response matches locked contract §4.
    """
    if model is None and not is_mock_mode:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    raw_text = request.reviewText.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Empty reviewText")

    # Preprocess: split into sentences, clean, word-segment
    result = preprocessor.process_for_inference(raw_text)
    processed = result["sentences"]
    is_translated = result["isTranslated"]

    if not processed:
        return PredictResponse(
            reviewText=raw_text,
            sentimentSummary="Unknown",
            confidenceAvg=0.0,
            analysis=[],
            keywords=[],
            isTranslated=is_translated,
        )

    analysis = []
    all_keywords = []
    labels_seen = set()

    for item in processed:
        segmented = item["processedSentence"]
        label, score = predict_sentence(segmented)
        labels_seen.add(label)

        # Primary aspect hint (rule-based tagging)
        hints = item.get("aspectHints", [])
        primary_hint = hints[0] if hints else None

        analysis.append(SentenceResult(
            sentence=item["originalSentence"],
            label=label,
            labelName=LABEL_MAP[label],
            aspectHint=primary_hint,
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
        reviewText=raw_text,
        sentimentSummary=sentiment_summary,
        confidenceAvg=confidence_avg,
        analysis=analysis,
        keywords=list(set(all_keywords)),
        isTranslated=is_translated,
    )


@app.post("/predict-batch")
async def predict_batch(request: PredictBatchRequest):
    """
    Predict sentiment for multiple reviews in a batch.
    - Skips items with empty/no-content text (counted as `skipped`)
    - Individual item errors do NOT fail the entire batch
    - Response matches locked contract §4
    """
    if model is None and not is_mock_mode:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    results = []
    skipped = 0

    for review in request.reviews:
        text = review.reviewText.strip() if review.reviewText else ""
        review_id = review.reviewId

        # Skip empty / no-content reviews
        if not text or text == "Không có bình luận":
            skipped += 1
            results.append({
                "reviewId": review_id,
                "sentimentSummary": "No Content",
                "confidenceAvg": 0.0,
                "analysis": [],
                "keywords": [],
                "isTranslated": False,
            })
            continue

        # Process — individual errors do NOT fail the batch
        try:
            pred_request = PredictRequest(reviewText=text)
            prediction = await predict(pred_request)
            results.append({
                "reviewId": review_id,
                **prediction.model_dump(),
            })
        except Exception as e:
            results.append({
                "reviewId": review_id,
                "error": {
                    "code": "ERR_PREDICT_ITEM",
                    "message": str(e),
                    "details": None,
                },
            })

    return {
        "results": results,
        "total": len(results),
        "skipped": skipped,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
