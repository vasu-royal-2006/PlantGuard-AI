"""PlantGuard AI — FastAPI application entry point."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from .inference import apply_augmentation, predict_all
from .model_loader import startup_load
from .schemas import (
    AccuracyRow,
    AugmentPreviewResponse,
    HealthResponse,
    PredictResponse,
    RobustnessRow,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-12s  %(levelname)-8s  %(message)s",
)
logger = logging.getLogger("plantguard")

# ---------------------------------------------------------------------------
# Paths (relative to backend/)
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent  # …/backend
MODEL_DIR = Path(os.getenv("MODEL_DIR", str(BASE_DIR / "models")))
CLASS_NAMES_PATH = Path(os.getenv("CLASS_NAMES_PATH", str(BASE_DIR / "class_names.json")))
RESEARCH_DIR = Path(os.getenv("RESEARCH_DIR", str(BASE_DIR / "research-results")))

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 8 * 1024 * 1024  # 8 MB


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load models and validate data
    models, class_names, device = startup_load(MODEL_DIR, CLASS_NAMES_PATH, RESEARCH_DIR)
    app.state.models = models
    app.state.class_names = class_names
    app.state.device = device
    yield
    # Shutdown: nothing special needed


app = FastAPI(
    title="PlantGuard AI",
    description="Serves six ResNet18 plant-disease classification models",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
_origins = [o.strip() for o in _origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        models_loaded=len(app.state.models),
        device=str(app.state.device),
    )


@app.get("/api/class-names")
async def class_names() -> list[str]:
    return app.state.class_names


@app.post("/api/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Upload JPG, PNG or WEBP.",
        )

    # Read and validate size
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image must be 8 MB or smaller.",
        )

    # Try opening with PIL
    try:
        import io
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image.")

    return predict_all(
        image,
        app.state.models,
        app.state.class_names,
        app.state.device,
    )


@app.get("/api/results/accuracy", response_model=list[AccuracyRow])
async def results_accuracy():
    df = pd.read_csv(RESEARCH_DIR / "accuracy_results.csv")
    return df.to_dict(orient="records")


@app.get("/api/results/robustness", response_model=list[RobustnessRow])
async def results_robustness():
    df = pd.read_csv(RESEARCH_DIR / "robustness_results.csv")
    return df.to_dict(orient="records")


@app.post("/api/augment-preview", response_model=AugmentPreviewResponse)
async def augment_preview(
    file: UploadFile = File(...),
    hue: float = Form(0.0),
    saturation: float = Form(1.0),
    brightness: float = Form(1.0),
):
    # Validate ranges
    if not (-0.5 <= hue <= 0.5):
        raise HTTPException(status_code=422, detail="hue must be in [-0.5, 0.5]")
    if not (0.0 <= saturation <= 2.0):
        raise HTTPException(status_code=422, detail="saturation must be in [0.0, 2.0]")
    if not (0.0 <= brightness <= 2.0):
        raise HTTPException(status_code=422, detail="brightness must be in [0.0, 2.0]")

    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Upload JPG, PNG or WEBP.",
        )

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image must be 8 MB or smaller.")

    try:
        import io
        image = Image.open(io.BytesIO(data))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image.")

    return apply_augmentation(image, hue=hue, saturation=saturation, brightness=brightness, original_bytes=data)
