"""Load and validate six ResNet18 plant-disease checkpoints."""

from __future__ import annotations

import gc
import json
import logging
from collections import OrderedDict
from pathlib import Path

import pandas as pd
import torch
import torch.nn as nn
from torchvision import models

logger = logging.getLogger("plantguard")

# Restrict PyTorch thread pool to reduce memory overhead in constrained environments
torch.set_num_threads(1)
torch.set_grad_enabled(False)

MODEL_KEYS: list[str] = [
    "baseline",
    "hue_only",
    "saturation_only",
    "brightness_only",
    "broad_colorjitter",
    "all_factor",
]

NUM_CLASSES = 38


def _resolve_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def load_class_names(class_names_path: Path) -> list[str]:
    """Load and validate class_names.json."""
    if not class_names_path.exists():
        raise FileNotFoundError(f"class_names.json not found at {class_names_path}")

    with open(class_names_path, "r", encoding="utf-8") as f:
        class_names = json.load(f)

    if not isinstance(class_names, list) or len(class_names) != NUM_CLASSES:
        raise ValueError(
            f"class_names.json must be a list of exactly {NUM_CLASSES} strings, "
            f"got {type(class_names).__name__} with {len(class_names) if isinstance(class_names, list) else '?'} items"
        )

    for i, name in enumerate(class_names):
        if not isinstance(name, str):
            raise ValueError(f"class_names[{i}] is {type(name).__name__}, expected str")

    return class_names


def _build_resnet18(num_classes: int = NUM_CLASSES) -> models.ResNet:
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model


def _trim_memory():
    """Force glibc to release free memory back to the OS in Linux containers."""
    gc.collect()
    try:
        import ctypes
        ctypes.CDLL("libc.so.6").malloc_trim(0)
    except Exception:
        pass


def load_models(
    model_dir: Path,
    class_names: list[str],
    device: torch.device,
) -> OrderedDict[str, models.ResNet]:
    """Load all six checkpoints, validate, and return an OrderedDict."""

    # Validate all .pth files exist before loading any
    for key in MODEL_KEYS:
        pth = model_dir / f"{key}.pth"
        if not pth.exists():
            raise FileNotFoundError(f"Checkpoint not found: {pth}")

    loaded: OrderedDict[str, models.ResNet] = OrderedDict()

    for key in MODEL_KEYS:
        pth = model_dir / f"{key}.pth"
        logger.info("Loading checkpoint: %s", pth.name)

        # Use mmap=True to avoid loading raw file bytes into heap memory
        ckpt = torch.load(pth, map_location=device, mmap=True)

        # Validate embedded class_names matches canonical list
        embedded = ckpt.get("class_names")
        if embedded is None:
            raise ValueError(f"Checkpoint {pth.name} missing 'class_names' key")
        if list(embedded) != list(class_names):
            raise ValueError(
                f"Checkpoint {pth.name} class_names mismatch with class_names.json"
            )

        net = _build_resnet18(NUM_CLASSES)
        net.load_state_dict(ckpt["state_dict"])  # NO strict=False
        net.eval()
        for p in net.parameters():
            p.requires_grad = False
        # Convert to bfloat16 to halve RAM footprint (22.4 MB vs 44.8 MB per model)
        # Allows all 6 models to comfortably fit within 512 MB container limits
        net.to(torch.bfloat16)
        net.to(device)
        loaded[key] = net

        # Immediately delete checkpoint dict and release memory back to kernel
        del ckpt
        _trim_memory()

    return loaded


def validate_csvs(research_dir: Path) -> None:
    """Validate accuracy and robustness CSV files."""

    # --- accuracy_results.csv ---
    acc_path = research_dir / "accuracy_results.csv"
    if not acc_path.exists():
        raise FileNotFoundError(f"Missing {acc_path}")
    acc_df = pd.read_csv(acc_path)
    expected_acc_cols = {"model", "accuracy"}
    if set(acc_df.columns) != expected_acc_cols:
        raise ValueError(
            f"accuracy_results.csv columns {list(acc_df.columns)} != {expected_acc_cols}"
        )
    if len(acc_df) != 6:
        raise ValueError(
            f"accuracy_results.csv expected 6 rows, got {len(acc_df)}"
        )

    # --- robustness_results.csv ---
    rob_path = research_dir / "robustness_results.csv"
    if not rob_path.exists():
        raise FileNotFoundError(f"Missing {rob_path}")
    rob_df = pd.read_csv(rob_path)
    expected_rob_cols = {"model", "distortion", "strength", "accuracy"}
    if set(rob_df.columns) != expected_rob_cols:
        raise ValueError(
            f"robustness_results.csv columns {list(rob_df.columns)} != {expected_rob_cols}"
        )
    if len(rob_df) != 60:
        raise ValueError(
            f"robustness_results.csv expected 60 rows, got {len(rob_df)}"
        )


def startup_load(
    model_dir: Path,
    class_names_path: Path,
    research_dir: Path,
) -> tuple[OrderedDict[str, models.ResNet], list[str], torch.device]:
    """Full startup sequence: validate → load → return (models, class_names, device)."""

    device = _resolve_device()
    logger.info("Using device: %s", device)

    # 1. Validate class_names.json
    class_names = load_class_names(class_names_path)
    logger.info("Validated class_names.json — %d classes", len(class_names))

    # 2-3. Validate checkpoint existence + load + validate embedded class_names
    loaded_models = load_models(model_dir, class_names, device)
    logger.info("Loaded %d models", len(loaded_models))

    # 4. Validate CSVs
    validate_csvs(research_dir)
    logger.info("Validated research CSV files")

    # 5. Ready
    _trim_memory()
    logger.info("PlantGuard AI backend ready — 6 models loaded on %s", device)

    return loaded_models, class_names, device
