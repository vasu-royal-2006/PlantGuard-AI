# PlantGuard AI — Testing Checklist

Manual verification checklist — every item must pass before declaring the system ready.

## Backend API

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

## Augmentation Lab

- [ ] Augmentation Lab with neutral sliders → "after" preview identical to original.
- [ ] Augmentation Lab with `hue=0.30` → visibly hue-shifted, no clipping artifacts.

## Frontend Integration

- [ ] CompareModels reads the last Detect result correctly.
- [ ] Mobile view (375 px) — upload, navigation, charts, sliders all work.
- [ ] Deployed frontend loads from a different device on a different network.
