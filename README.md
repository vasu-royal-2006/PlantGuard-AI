# PlantGuard AI

**Evaluating Photometric Robustness in Plant Disease Classification Through Targeted Color Augmentation**

PlantGuard AI is a full-stack research prototype that trains six ResNet-18 variants with different color-augmentation strategies on PlantVillage and lets users interactively compare their accuracy, robustness, and behavior under live distortions.

> ⚠️ **PlantGuard AI is a research prototype. Not an agricultural diagnosis service.**

---

## Architecture

```
┌──────────────────────┐         ┌──────────────────────────────────┐
│                      │  HTTP   │                                  │
│   Frontend           │◄───────►│   Backend                        │
│   React + Vite       │  JSON   │   FastAPI + Uvicorn              │
│   (port 5173)        │         │   (port 8000)                    │
│                      │         │                                  │
│  • Detect page       │         │  ┌────────────┐  ┌────────────┐ │
│  • Compare Models    │         │  │ 6 ResNet-18 │  │ CSV result │ │
│  • Research Results  │         │  │ checkpoints │  │ files      │ │
│  • Augmentation Lab  │         │  │ (.pth)      │  │ (.csv)     │ │
│                      │         │  └────────────┘  └────────────┘ │
└──────────────────────┘         └──────────────────────────────────┘
```

---

## Prerequisites

| Tool       | Version  |
|------------|----------|
| Python     | 3.10+    |
| Node.js    | 18+      |

---

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux / macOS
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable           | Default                    | Description                                   |
|--------------------|----------------------------|-----------------------------------------------|
| `ALLOWED_ORIGINS`  | `http://localhost:5173`    | Comma-separated CORS origins                  |
| `PORT`             | `8000`                     | Port the backend listens on                   |
| `MODEL_DIR`        | `./models`                 | Directory containing `.pth` checkpoints       |
| `RESEARCH_DIR`     | `./research-results`       | Directory containing result CSVs              |
| `CLASS_NAMES_PATH` | `./class_names.json`       | Path to the 38-class name JSON file           |

### Frontend (`frontend/.env`)

| Variable             | Default                  | Description                          |
|----------------------|--------------------------|--------------------------------------|
| `VITE_API_BASE_URL`  | `http://localhost:8000`  | Base URL of the backend API          |

---

## API Routes

| Method | Path                     | Purpose                                           |
|--------|--------------------------|---------------------------------------------------|
| GET    | `/api/health`            | Health check — returns model count and device      |
| GET    | `/api/class-names`       | Returns the 38 PlantVillage class names            |
| POST   | `/api/predict`           | Upload a leaf image → predictions from all 6 models|
| GET    | `/api/results/accuracy`  | Accuracy results parsed from CSV                   |
| GET    | `/api/results/robustness`| Robustness results parsed from CSV                 |
| POST   | `/api/augment-preview`   | Upload image + hue/sat/bright sliders → base64 PNG |

---

## Deployment

### Backend (Render / Railway)

1. Push the `backend/` directory as the root of the service.
2. The included `Procfile` starts the server:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. Set `ALLOWED_ORIGINS` to your deployed frontend URL.

### Frontend (Vercel)

1. Push the `frontend/` directory as the root of the Vercel project.
2. The included `vercel.json` handles client-side routing:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
3. Set `VITE_API_BASE_URL` to your deployed backend URL.

---

## Team

| Registration | Team Member               |
|--------------|---------------------------|
| 23BCE20241   | Arshiya Shaik             |
| 23BCE9771    | Ch Bharadwaj              |
| 23BCE20281   | K NAVA NEETH KUMAR REDDY  |
| 23BCE7636    | N Vasu                    |

---

## License

This project is a university research prototype. See your institution's policies for reuse and distribution.
