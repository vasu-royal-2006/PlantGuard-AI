"""Image preprocessing, prediction, and distortion utilities."""

from __future__ import annotations

import base64
import io
from collections import OrderedDict

import torch
from PIL import Image
from torchvision import transforms
from torchvision.transforms import functional as F

from .schemas import PredictResponse, SinglePrediction, AugmentPreviewResponse
from .model_loader import MODEL_KEYS

# Preprocessing pipeline (matches training)
_preprocess = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=(0.485, 0.456, 0.406),
            std=(0.229, 0.224, 0.225),
        ),
    ]
)


def prepare_image(image: Image.Image, device: torch.device) -> torch.Tensor:
    """Convert a PIL image to a model-ready tensor.

    Distortion must be applied to the raw PIL image BEFORE calling this.
    """
    image = image.convert("RGB")
    tensor = _preprocess(image)  # (3, 224, 224)
    return tensor.unsqueeze(0).to(device)  # (1, 3, 224, 224)


@torch.inference_mode()
def predict_all(
    image: Image.Image,
    models: OrderedDict,
    class_names: list[str],
    device: torch.device,
) -> PredictResponse:
    """Run inference on all six models and return unified response."""
    tensor = prepare_image(image, device)

    predictions: dict[str, SinglePrediction] = {}

    for key in MODEL_KEYS:
        net = models[key]
        model_dtype = next(net.parameters()).dtype
        x = tensor.to(dtype=model_dtype)
        logits = net(x).float()
        probs = torch.softmax(logits, dim=1)
        confidence, idx = probs.max(dim=1)
        predictions[key] = SinglePrediction(
            class_name=class_names[idx.item()],
            confidence=float(confidence.item()),
        )

    return PredictResponse(
        predictions=predictions,
        model_order=list(MODEL_KEYS),
    )


def apply_augmentation(
    image: Image.Image,
    hue: float = 0.0,
    saturation: float = 1.0,
    brightness: float = 1.0,
    original_bytes: bytes | None = None,
) -> AugmentPreviewResponse:
    """Apply color distortions and return a base64-encoded PNG preview."""
    # Neutral values check: return original image if neutral and original bytes provided
    is_neutral = (hue == 0.0 or hue == 0) and (saturation == 1.0 or saturation == 1) and (brightness == 1.0 or brightness == 1)
    if is_neutral and original_bytes is not None:
        # Check if original was already PNG, otherwise encode original RGB to PNG
        b64 = base64.b64encode(original_bytes).decode("ascii")
        return AugmentPreviewResponse(preview_base64=b64)

    img = image.convert("RGB")

    # Processing order (must be exactly this):
    # 1. Image.open(...).convert("RGB")
    # 2. torchvision.transforms.functional.adjust_hue(img, hue) if hue != 0
    # 3. adjust_saturation(img, saturation) if saturation != 1.0
    # 4. adjust_brightness(img, brightness) if brightness != 1.0
    # 5. Encode to PNG
    if hue != 0:
        img = F.adjust_hue(img, hue)
    if saturation != 1.0:
        img = F.adjust_saturation(img, saturation)
    if brightness != 1.0:
        img = F.adjust_brightness(img, brightness)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    return AugmentPreviewResponse(preview_base64=b64)
