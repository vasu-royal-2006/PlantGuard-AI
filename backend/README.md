# PlantGuard AI — Backend

FastAPI backend serving six ResNet18 plant-disease classification models trained on the PlantVillage dataset. Each model was trained with a different color-augmentation strategy to study robustness to color distortions.

## Quick Start

```bash
cd backend

# Create & activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies (CPU-only PyTorch)
pip install -r requirements.txt

# Copy and edit environment variables
cp .env.example .env

# Run the server
uvicorn app.main:app --reload --port 8000
```

The server will validate all model checkpoints, class names, and research CSVs on startup. If any validation fails the process exits with an error.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `PORT` | `8000` | Server port (used by Procfile) |
| `MODEL_DIR` | `./models` | Path to `.pth` checkpoint directory |
| `RESEARCH_DIR` | `./research-results` | Path to research CSV directory |
| `CLASS_NAMES_PATH` | `./class_names.json` | Path to class names JSON file |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check — returns model count and device |
| `GET` | `/api/class-names` | Returns the 38 class name strings |
| `POST` | `/api/predict` | Upload an image → predictions from all 6 models |
| `GET` | `/api/results/accuracy` | Accuracy results for all models |
| `GET` | `/api/results/robustness` | Robustness results (distortion × strength × model) |
| `POST` | `/api/augment-preview` | Upload image + hue/saturation/brightness → base64 PNG |

### POST /api/predict

- **Body**: `multipart/form-data` with a `file` field
- **Accepted types**: `image/jpeg`, `image/png`, `image/webp`
- **Max size**: 8 MB
- **Response**:
```json
{
  "predictions": {
    "baseline": {"class_name": "Tomato___healthy", "confidence": 0.9972},
    "hue_only": {"class_name": "Tomato___healthy", "confidence": 0.9815},
    ...
  },
  "model_order": ["baseline", "hue_only", "saturation_only", "brightness_only", "broad_colorjitter", "all_factor"]
}
```

### POST /api/augment-preview

- **Body**: `multipart/form-data` with `file`, `hue` (float, default 0.0), `saturation` (float, default 1.0), `brightness` (float, default 1.0)
- **Response**: `{"preview_base64": "<base64-encoded PNG>"}`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app, CORS, lifespan, routes
│   ├── model_loader.py   # Checkpoint loading & startup validation
│   ├── inference.py       # Preprocessing, prediction, augmentation
│   └── schemas.py         # Pydantic response models
├── models/                # Six .pth checkpoints (not in repo)
├── research-results/      # accuracy_results.csv, robustness_results.csv
├── class_names.json       # 38 class name strings
├── requirements.txt
├── Procfile
├── .env.example
└── README.md
```

## Models

| Key | Augmentation Strategy |
|---|---|
| `baseline` | No color augmentation |
| `hue_only` | Random hue jitter |
| `saturation_only` | Random saturation jitter |
| `brightness_only` | Random brightness jitter |
| `broad_colorjitter` | Broad ColorJitter (H+S+B) |
| `all_factor` | All augmentation factors combined |

## Deployment

A `Procfile` is included for platforms like Heroku / Railway:

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
