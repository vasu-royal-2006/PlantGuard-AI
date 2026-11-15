# PlantGuard AI — Frontend

React + Vite + Tailwind CSS web interface for the PlantGuard AI research prototype: *Evaluating Photometric Robustness in Plant Disease Classification Through Targeted Color Augmentation*.

> **Disclaimer:** *PlantGuard AI is a research prototype. Not an agricultural diagnosis service.*

---

## Features

- **Home (`/`)**: Overview of the research study, core research question, 6 model cards with clean accuracy metrics fetched live from the backend API, and key findings preview.
- **Detect (`/detect`)**: Upload leaf images (JPG, PNG, WEBP, ≤ 8 MB) to run synchronous multi-model inference across all 6 ResNet18 checkpoints.
- **Compare Models (`/compare`)**: Bar chart and side-by-side card grid comparing model confidences and highlighting any inter-model class disagreements.
- **Augmentation Lab (`/augmentation-lab`)**: Interactive photometric distortion sliders (Hue, Saturation, Brightness) with server-side distorted image preview and single-click multi-model prediction.
- **Robustness (`/robustness`)**: Comprehensive visualization of experimental results, including clean accuracy, hue distortion breakdown (headline result), saturation/brightness response, and a full 60-cell interactive heatmap.
- **Methodology (`/methodology`)**: Dataset specifications (PlantVillage 70/15/15 split), 38 crop-disease class index contract, ResNet18 architecture details, training hyperparameters, and evaluation pipeline.
- **Limitations (`/limitations`)**: Verbatim academic and practical limitations of the experimental setup.
- **Team (`/team`)**: Project contributors and registration details.

---

## Tech Stack

- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with custom palette (teal `#0F766E`, neutral dark `#111827`, off-white `#F9FAFB`)
- **Routing:** React Router v6
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Local Development

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional, defaults to `http://127.0.0.1:8000`):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. Build for production:
   ```bash
   npm run build
   ```

6. Preview production build:
   ```bash
   npm run preview
   ```

---

## Deployment (Vercel)

The repository includes `vercel.json` configured with SPA fallback rewrites:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
Set the environment variable `VITE_API_BASE_URL` in your Vercel project settings to point to your deployed backend URL (e.g., `https://plantguard-backend.onrender.com`).

