# PlantGuard AI — Complete Build Specification (Production-Ready)

You are building a **complete, deployable research demonstration website** for a finished capstone project. All trained models, class names, and research result files already exist in the folder structure below. Your job is to build the entire frontend and backend around them.

**Hard rule: produce production-ready code only. No sample code, no placeholder values, no TODO stubs, no "// implement here" comments. Every file must run cleanly the first time.**

---

## 1. Project identity

- **Project name:** PlantGuard AI
- **Research title:** *Evaluating Photometric Robustness in Plant Disease Classification Through Targeted Color Augmentation*
- **Purpose:** A research prototype website that (a) runs one uploaded leaf image through six trained ResNet18 models, (b) demonstrates interactive color distortions, and (c) displays the measured robustness results.
- **Not a commercial or clinical tool.** Every page must display: *"PlantGuard AI is a research prototype. Not an agricultural diagnosis service."*
- **Model architecture:** ResNet18 (torchvision), 38 output classes, ImageNet-pretrained, then fine-tuned on PlantVillage.
- **The six models differ only in the color augmentation applied during training.** Same architecture, same dataset, same hyperparameters, same training loop. Different augmentation = different checkpoint.

---

## 2. Existing files on disk — DO NOT regenerate, DO NOT modify

```
PlantGuard-AI/
├── backend/
│   ├── models/
│   │   ├── baseline.pth
│   │   ├── hue_only.pth
│   │   ├── saturation_only.pth
│   │   ├── brightness_only.pth
│   │   ├── broad_colorjitter.pth
│   │   └── all_factor.pth
│   ├── class_names.json
│   └── research-results/
│       ├── accuracy_results.csv
│       └── robustness_results.csv
└── frontend/       ← you will create this
```

### 2.1 Checkpoint format (CRITICAL — read every line)

Each `.pth` file is a Python dict saved by `torch.save`. The keys are:

- `state_dict` — the model weights (an OrderedDict).
- `epoch` — integer, the epoch at which the checkpoint was saved.
- `aug_config` — string, human-readable augmentation description.
- `class_names` — list of exactly 38 strings in the order used at training time.

To load:

```python
from torchvision import models
import torch.nn as nn

model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 38)   # 512 → 38
ckpt = torch.load(path, map_location=device)
model.load_state_dict(ckpt["state_dict"])        # NO strict=False — ever
model.eval()
```

If `load_state_dict` raises a key mismatch, **fail startup loudly** and log the exact missing and unexpected keys. Do not silently continue.

**Additional startup validation:** each checkpoint's embedded `ckpt["class_names"]` must exactly equal the contents of `class_names.json`, list-for-list. If they differ, fail startup with a diff showing which indices disagree. This catches the most dangerous failure mode — an index-order bug that makes predictions silently garbage.

Load on the device returned by `torch.device("cuda" if torch.cuda.is_available() else "cpu")`. Load all six models **exactly once at FastAPI startup** and store them in `app.state.models` as an ordered dict keyed by:

`baseline`, `hue_only`, `saturation_only`, `brightness_only`, `broad_colorjitter`, `all_factor`

This order is used everywhere — backend responses, frontend tables, charts, everything.

### 2.2 `class_names.json`

A JSON array of exactly 38 strings in training-time index order. **Never sort, never re-index, never lowercase.** The order in this file is the contract.

### 2.3 `accuracy_results.csv`

Two columns: `model, accuracy`. Six rows (one per model). Accuracy is a percentage (0–100), clean (no distortion).

### 2.4 `robustness_results.csv`

Four columns: `model, distortion, strength, accuracy`. Exactly 72 rows:

- 6 models × 4 distortion types × 3 strengths (for `clean`, only strength `0`)
- `clean` → strengths `[0]`
- `hue` → strengths `[0.1, 0.2, 0.3]` (fraction of the hue circle)
- `saturation` → strengths `[0.8, 1.0, 1.2]` (multiplicative scale)
- `brightness` → strengths `[0.8, 1.0, 1.2]` (multiplicative scale)

**Never hardcode any accuracy number anywhere in the frontend.** Every chart value comes from `/api/results/*`.

---

## 3. Preprocessing contract — must match training exactly

For every inference request and every distortion preview:

1. Decode upload → **convert to RGB** (drop alpha, handle grayscale, honor EXIF orientation).
2. `transforms.Resize((224, 224))` — plain resize, not crop, not `RandomResizedCrop`.
3. `transforms.ToTensor()`.
4. `transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))`.
5. `unsqueeze(0)` and move to device.

**Non-negotiable ordering rule:** whenever a photometric distortion is applied (augmentation lab, "predict with distortion"), it is applied to the **raw PIL image**, BEFORE `ToTensor()` and `Normalize()`. Never distort a normalized tensor. The scientific claim in this project depends entirely on this ordering being correct.

---

## 4. Backend — FastAPI

### 4.1 File structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py            ← FastAPI app, CORS, lifespan, startup loading
│   ├── model_loader.py    ← loads 6 checkpoints + class_names.json, validates
│   ├── inference.py       ← preprocessing, predict_all, distortion utilities
│   └── schemas.py         ← Pydantic response models
├── requirements.txt
├── .env.example
├── Procfile
└── README.md
```

### 4.2 Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Returns `{"status": "ok", "models_loaded": 6, "device": "<device>"}` |
| `GET` | `/api/class-names` | Returns JSON array of 38 class names in exact index order |
| `POST` | `/api/predict` | Accepts one image, returns predictions from all six models |
| `GET` | `/api/results/accuracy` | Parses `accuracy_results.csv`, returns JSON array |
| `GET` | `/api/results/robustness` | Parses `robustness_results.csv`, returns JSON array |
| `POST` | `/api/augment-preview` | Accepts image + hue/saturation/brightness, returns distorted image as base64 PNG |

### 4.3 `/api/predict`

**Request:** `multipart/form-data`, field name `file`.

**Validation, in this order:**

1. `file.content_type` must be in `{"image/jpeg", "image/png", "image/webp"}` → else HTTP 415 with body `{"detail": "Upload JPG, PNG or WEBP."}`
2. `len(data)` must be ≤ 8 × 1024 × 1024 bytes → else HTTP 413 with body `{"detail": "Image must be 8 MB or smaller."}`
3. `PIL.Image.open(...).convert("RGB")` must succeed → else HTTP 400 with body `{"detail": "Invalid image."}`

**Response (200):**

```json
{
  "predictions": {
    "baseline":          {"class_name": "...", "confidence": 0.9972},
    "hue_only":          {"class_name": "...", "confidence": 0.9956},
    "saturation_only":   {"class_name": "...", "confidence": 0.9975},
    "brightness_only":   {"class_name": "...", "confidence": 0.9966},
    "broad_colorjitter": {"class_name": "...", "confidence": 0.9973},
    "all_factor":        {"class_name": "...", "confidence": 0.9959}
  },
  "model_order": [
    "baseline", "hue_only", "saturation_only",
    "brightness_only", "broad_colorjitter", "all_factor"
  ]
}
```

`confidence` is `float(torch.softmax(logits, dim=1).max())`. Backend returns the raw 0–1 float; the frontend handles percent conversion and display formatting. Run all inference inside `torch.inference_mode()`.

### 4.4 `/api/augment-preview`

**Request:** `multipart/form-data`:

- `file` — image
- `hue` — float, default `0.0`, accepted range `[-0.5, 0.5]`
- `saturation` — float, default `1.0`, accepted range `[0.0, 2.0]`
- `brightness` — float, default `1.0`, accepted range `[0.0, 2.0]`

**Processing order (must be exactly this):**

1. `Image.open(...).convert("RGB")`
2. `torchvision.transforms.functional.adjust_hue(img, hue)` if `hue != 0`
3. `adjust_saturation(img, saturation)` if `saturation != 1.0`
4. `adjust_brightness(img, brightness)` if `brightness != 1.0`
5. Encode to PNG, return `{"preview_base64": "<base64 without data URI prefix>"}`

Neutral values (all defaults) must return a byte-identical copy of the original image.

Validate that the distortion is applied to the **raw image**, not a normalized tensor.

### 4.5 CORS

Allow only origins listed in `ALLOWED_ORIGINS` env var (comma-separated). Local default: `http://localhost:5173`. Methods: `GET`, `POST`. Headers: `*`. **Never use `allow_origins=["*"]` in production.**

### 4.6 Environment variables (`.env.example`)

```
ALLOWED_ORIGINS=http://localhost:5173
PORT=8000
MODEL_DIR=./models
RESEARCH_DIR=./research-results
CLASS_NAMES_PATH=./class_names.json
```

### 4.7 `requirements.txt`

```
--extra-index-url https://download.pytorch.org/whl/cpu
fastapi
uvicorn[standard]
python-multipart
torch
torchvision
pillow
numpy
pandas
python-dotenv
```

Use CPU wheels to keep the deployment image small — ResNet18 CPU inference is ~50 ms per model per image, fast enough for this use case.

### 4.8 `Procfile` (for Render / Railway)

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 4.9 Startup lifespan

On FastAPI startup, in this order:

1. Validate `class_names.json` exists and parses to a list of exactly 38 strings.
2. Validate all six `.pth` files exist.
3. Load all six models. Validate each checkpoint's embedded `class_names` matches `class_names.json` element-for-element.
4. Validate both CSVs parse cleanly and have the expected columns and row counts.
5. Log: `PlantGuard AI backend ready — 6 models loaded on <device>`.

Any failure → log a specific error and `raise` so the process exits (do not serve with missing models).

---

## 5. Frontend — React + Vite

### 5.1 File structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── ResearchBanner.jsx
│   │   ├── ImageUploader.jsx
│   │   ├── PredictionTable.jsx
│   │   ├── MetricChart.jsx
│   │   ├── Loader.jsx
│   │   └── ErrorMessage.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Detect.jsx
│   │   ├── CompareModels.jsx
│   │   ├── AugmentationLab.jsx
│   │   ├── Robustness.jsx
│   │   ├── Methodology.jsx
│   │   ├── Limitations.jsx
│   │   └── Team.jsx
│   ├── services/
│   │   └── api.js
│   ├── context/
│   │   └── PredictionContext.jsx   ← shared last-prediction store
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.example
├── vercel.json
└── README.md
```

### 5.2 Dependencies

- `react`, `react-dom`, `react-router-dom`
- `axios`
- `recharts`
- `lucide-react`
- `tailwindcss`, `postcss`, `autoprefixer`
- Vite + `@vitejs/plugin-react`

### 5.3 `services/api.js`

Single axios instance:

```js
baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
timeout: 120000
```

Exported functions:

- `predictAllModels(file)`
- `fetchAccuracy()`
- `fetchRobustness()`
- `fetchClassNames()`
- `requestAugmentPreview(file, hue, saturation, brightness)`
- `checkHealth()`

Every function wraps errors into a `{ok: false, error: string}` shape. UI never displays raw stack traces.

### 5.4 Shared state

`PredictionContext` stores the last prediction (image data URL + response from `/api/predict`). Detect writes it; CompareModels reads it. If empty when CompareModels mounts, show a call-to-action linking to Detect.

### 5.5 Pages — exact requirements

#### Home

- Hero: full research title, one-sentence description, two CTA buttons: **"Explore the experiment"** → `/robustness`, **"Try six-model prediction"** → `/detect`.
- Research question callout (verbatim): *"Does color augmentation provide general color robustness, or does robustness mainly apply to the specific color factor used during training?"*
- Six model cards in this exact order: **Baseline, Hue-only, Saturation-only, Brightness-only, Broad ColorJitter, All-factor.** Each card shows the model name, its one-line augmentation description, and its clean accuracy fetched from `/api/results/accuracy`.
- "Research findings preview" band: *"Robustness depends on the distortion factor and the training exposure — see the results."*
- Persistent research prototype banner.

#### Detect

- File uploader: JPG, PNG, WEBP. Max 8 MB stated on the page.
- Preview of uploaded image with Remove and Replace controls.
- Submit button → one call to `/api/predict`. Button disabled while loading.
- Loading indicator during inference.
- On success, `PredictionTable` displays all six predictions in the **fixed model order** (baseline, hue_only, saturation_only, brightness_only, broad_colorjitter, all_factor). Columns: Model | Predicted class | Confidence (% with 2 decimals).
- Below the table: *"Confidence is softmax output, not a calibrated probability of correctness."*
- Distinct error UI for: file too large, wrong type, invalid image, network failure.
- Save result to `PredictionContext` so CompareModels can read it.

#### CompareModels

- Reads last prediction from context. If missing, shows a CTA button to Detect.
- Bar chart (Recharts) comparing all six models' confidences for the same image, in fixed model order.
- Side-by-side card grid showing each model's predicted class and confidence.
- Highlight the highest-confidence model.
- Explicitly call out any class disagreement across the six models.
- Explanatory line: *"All six models share the same architecture and training data; they differ only in the color augmentation applied during training."*

#### AugmentationLab

- Upload one image.
- Three sliders:
  - **Hue** — range `-0.5` to `0.5`, step `0.05`, default `0`. Label: *"Fraction of the hue circle — matches the experimental hue shift."*
  - **Saturation** — range `0.0` to `2.0`, step `0.05`, default `1.0`. Label: *"Multiplicative scale factor (1.0 = unchanged)."*
  - **Brightness** — range `0.0` to `2.0`, step `0.05`, default `1.0`. Label: *"Multiplicative scale factor (1.0 = unchanged)."*
- **Before/after preview** side-by-side. After image is fetched from `/api/augment-preview` — never distorted client-side. Debounce slider changes by 200 ms before firing the request.
- **Reset button** restores all sliders to neutral.
- Optional but preferred: **"Predict with this distortion"** button → POSTs the distorted image to `/api/predict` and shows six predictions. If implemented, distortion happens server-side first, never on the client.
- Page caption: *"Preview is generated server-side using the same distortion implementation as the evaluation pipeline."*

#### Robustness

Fetch `/api/results/robustness` and `/api/results/accuracy`. Render:

1. **Clean accuracy by model** — horizontal bar chart.
2. **Hue distortion accuracy by model and strength** — grouped bar chart or multi-line. X-axis: hue strength `0.1, 0.2, 0.3`. One series per model. **This is the headline chart.**
3. **Saturation distortion by model and strength** — same shape.
4. **Brightness distortion by model and strength** — same shape.
5. **Heatmap** (rows = models, columns = distortion × strength, cells = accuracy) — optional but strongly preferred.

Under every chart, a caption block showing dataset, distortion order, and units.

A dedicated callout above the hue chart: *"Hue shift at +0.20 is a strong synthetic shift, not equivalent to ordinary outdoor lighting variation."*

A caption below the saturation and brightness charts: *"Distortion range 0.8–1.2× had little effect on any model — the differences here are within run-to-run variance."*

#### Methodology

Render these sections in order:

1. **Dataset:** PlantVillage, 38 classes, 54,305 images total. 70/15/15 split, seed 42. Counts: train 38,013 / val 8,146 / test 8,146.
2. **Class list:** fetch from `/api/class-names` and render all 38 as numbered badges in index order (0–37).
3. **Architecture:** ResNet18 (ImageNet-pretrained), classifier head `nn.Linear(512, 38)`.
4. **Training:** AdamW, learning rate `3e-4`, batch size 32, 10 epochs, cosine LR schedule, cross-entropy loss, mixed precision (`autocast` + `GradScaler`), NVIDIA T4 GPU (Colab free tier).
5. **Augmentation configs table** (verbatim):

| Model | Training augmentation |
|---|---|
| Baseline | None |
| Hue-only | `ColorJitter(hue=0.2)` |
| Saturation-only | `ColorJitter(saturation=0.5)` |
| Brightness-only | `ColorJitter(brightness=0.5)` |
| Broad ColorJitter | `ColorJitter(brightness=0.4, contrast=0.4, saturation=0.4, hue=0.1)` |
| All-factor | `ColorJitter(brightness=0.5, contrast=0.5, saturation=0.5, hue=0.2)` |

6. **Evaluation pipeline:** distortion applied to raw PIL image → RGB conversion → `Resize(224, 224)` → `ToTensor()` → `Normalize(ImageNet)`. Distortion is **explicitly applied before normalization**.
7. **Metric:** top-1 accuracy (%) on the test split.

#### Limitations

Render as a bullet list, verbatim:

- One architecture (ResNet18) and one PlantVillage-derived dataset for the main controlled experiment.
- The strongest hue shift tested (+0.30) is synthetic and is not equivalent to real-world camera or lighting variation.
- Saturation and brightness distortions in the 0.8–1.2× range had little effect on any model; conclusions about those factors are limited to that range.
- Broad ColorJitter was trained with `hue=0.1`; its drop at `hue=0.30` reflects out-of-distribution testing, not a generalization failure.
- This system is a research prototype and must not be used for real agricultural decisions.
- Softmax confidences are not calibrated probabilities of correctness.
- All results come from a single training run per model; run-to-run variance has not been characterized.

#### Team

Table:

| Registration number | Team member |
|---|---|
| 23BCE20241 | Arshiya Shaik |
| 23BCE9771 | Ch Bharadwaj |
| 23BCE20281 | K NAVA NEETH KUMAR REDDY |
| 23BCE7636 | N Vasu |

Below the table: *"Official university/department details, project guide, academic year, and acknowledgements will be added after confirmation."*

---

## 6. Design system

- **Palette:** green/teal accent (`#0F766E`), off-white background (`#F9FAFB`), dark text (`#111827`), neutral card backgrounds (`#FFFFFF`) with subtle shadow.
- **Typography:** system sans-serif stack (`Inter`, `Segoe UI`, `system-ui`). Bold headings, regular body.
- **Model color coding — used consistently in every chart, table, and legend:**

| Model | Color |
|---|---|
| baseline | gray (`#6B7280`) |
| hue_only | amber (`#F59E0B`) |
| saturation_only | blue (`#3B82F6`) |
| brightness_only | orange (`#F97316`) |
| broad_colorjitter | purple (`#8B5CF6`) |
| all_factor | teal (`#0F766E`) |

- **Never rely on color alone** — every legend and table shows both the color swatch and the model name.
- **Responsive:** must work at 375 px width. Uploads, tables, sliders, and charts all usable on mobile.
- **Accessibility:** WCAG AA contrast on all text. All interactive controls are keyboard-navigable. `aria-label` on icons and sliders.
- **Research prototype banner** persistent in `Footer` on every page.

---

## 7. Deployment configuration

### Frontend (Vercel)

- `vite.config.js` sets `base: '/'`.
- `.env.example`: `VITE_API_BASE_URL=https://your-backend-host.onrender.com`
- `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend (Render / Railway / any Python host, ≥ 1 GB RAM)

- Use the `Procfile` above.
- Six `.pth` files total ~270 MB — verify the host accepts this bundle size. If not, document in `backend/README.md` how to fetch them from cloud storage (e.g., Google Drive, S3) during the deploy step.
- `ALLOWED_ORIGINS` must be set to the deployed frontend URL, never `*`.

---

## 8. `TESTING.md` — manual verification checklist

Create this at the project root. Every item must pass before declaring done.

- [ ] `GET /api/health` → `{"status": "ok", "models_loaded": 6, ...}`
- [ ] Upload a real leaf image → six predictions with plausible classes and confidences.
- [ ] Upload the same image again → identical predictions (deterministic).
- [ ] Upload a `.txt` file → HTTP 415 with clear message.
- [ ] Upload a 10 MB image → HTTP 413 with clear message.
- [ ] Upload a corrupted JPG → HTTP 400 with clear message.
- [ ] `GET /api/class-names` → exactly 38 strings.
- [ ] `GET /api/results/accuracy` → 6 rows.
- [ ] `GET /api/results/robustness` → 72 rows.
- [ ] Spot-check 3 chart values against the CSV — must match exactly.
- [ ] Augmentation Lab with neutral sliders → "after" preview identical to original.
- [ ] Augmentation Lab with `hue=0.30` → visibly hue-shifted, no clipping artifacts.
- [ ] CompareModels reads the last Detect result correctly.
- [ ] Mobile view (375 px) — upload, navigation, charts, sliders all work.
- [ ] Deployed frontend loads from a different device on a different network.

---

## 9. Files you must produce

### Backend
- `backend/app/__init__.py`
- `backend/app/main.py`
- `backend/app/model_loader.py`
- `backend/app/inference.py`
- `backend/app/schemas.py`
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/Procfile`
- `backend/README.md`

### Frontend
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/index.html`
- `frontend/tailwind.config.js`
- `frontend/postcss.config.js`
- `frontend/.env.example`
- `frontend/vercel.json`
- All files under `frontend/src/` listed in section 5.1.
- `frontend/README.md`

### Project root
- `README.md` — overall setup, ASCII architecture diagram, environment variables, deployment steps.
- `TESTING.md` — the checklist from section 8.
- `.gitignore` — must include `.venv/`, `venv/`, `__pycache__/`, `*.py[cod]`, `node_modules/`, `dist/`, `frontend/dist/`, `.env`, `.env.local`, `.ipynb_checkpoints/`, `.DS_Store`, `*.pth.tmp`.

---

## 10. Hard constraints — violations mean the build is wrong

- **Never hardcode any accuracy value in the frontend.** Every chart value comes from `/api/results/*`.
- **Never apply photometric distortion to normalized tensors.** Distortion is always on raw PIL images, before `ToTensor()` and `Normalize()`.
- **Never re-sort, re-index, or transform `class_names.json`.** The order is training order.
- **Never load checkpoints with `strict=False`.** Key mismatches must fail loudly.
- **Always `model.eval()`** before inference.
- **Always run inference inside `torch.inference_mode()`.**
- **Never present placeholder numbers as results.** Use only the CSVs.
- **Never omit the research prototype disclaimer** on any page.
- **Never describe softmax confidence as a probability of correctness.** Always label it as softmax confidence.
- **Do not use Next.js, Remix, or any framework other than React + Vite.**
- **Do not include inline `// TODO`, `# placeholder`, or sample stub code.**

---

## 11. Definition of done

The build is complete when all of these pass:

1. `cd backend && uvicorn app.main:app --reload` starts cleanly and logs `6 models loaded`.
2. `cd frontend && npm run dev` starts cleanly with zero console errors on Home.
3. Detect page successfully predicts on a real uploaded leaf image.
4. Robustness page renders all required charts from the live API, values match the CSVs.
5. Augmentation Lab sliders visibly distort the preview via the backend, and Reset restores the original.
6. Methodology page renders all 38 class names from the API and the augmentation table verbatim.
7. `npm run build` produces a `dist/` with zero build errors.
8. `vite preview` locally passes every item in `TESTING.md`.

---

## 12. Build order

1. **Backend first.** Create `backend/app/` files. Run `uvicorn app.main:app` locally. Verify `/api/health`, `/api/class-names`, and `/api/predict` with `curl` (use a real image from the test set). Only move to the frontend when the backend is fully green.
2. **Frontend scaffolding.** `npm create vite`, install dependencies, set up Tailwind, wire `App.jsx` + router + Navbar + Footer + ResearchBanner.
3. **Pages in this order:** Home → Detect → CompareModels → AugmentationLab → Robustness → Methodology → Limitations → Team.
4. **Wire every page to the live API.** Test each page in the browser as you finish it — never trust a page until you have clicked through it.
5. **`npm run build`.** Fix every error and warning.
6. **Run through `TESTING.md`** end to end.
7. **Write the READMEs.** Include setup commands, env vars, API routes, and deployment steps.

Build the entire project now.