"""Pydantic response models for PlantGuard AI API."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    models_loaded: int
    device: str


class SinglePrediction(BaseModel):
    class_name: str
    confidence: float


class PredictResponse(BaseModel):
    predictions: dict[str, SinglePrediction]
    model_order: list[str]


class AugmentPreviewResponse(BaseModel):
    preview_base64: str


class AccuracyRow(BaseModel):
    model: str
    accuracy: float


class RobustnessRow(BaseModel):
    model: str
    distortion: str
    strength: float
    accuracy: float
