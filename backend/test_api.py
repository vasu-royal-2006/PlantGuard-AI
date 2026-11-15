"""End-to-end unit and integration tests for PlantGuard AI backend endpoints."""

import io
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

def test_all():
    with TestClient(app) as client:
        print("Testing /api/health...")
        r = client.get("/api/health")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "ok"
        assert data["models_loaded"] == 6
        print(f"  Health OK: {data}")

        print("Testing /api/class-names...")
        r = client.get("/api/class-names")
        assert r.status_code == 200, r.text
        classes = r.json()
        assert len(classes) == 38
        print(f"  Class names OK: {len(classes)} classes")

        print("Testing /api/results/accuracy...")
        r = client.get("/api/results/accuracy")
        assert r.status_code == 200, r.text
        acc = r.json()
        assert len(acc) == 6
        print(f"  Accuracy results OK: {len(acc)} rows")

        print("Testing /api/results/robustness...")
        r = client.get("/api/results/robustness")
        assert r.status_code == 200, r.text
        rob = r.json()
        assert len(rob) == 60
        print(f"  Robustness results OK: {len(rob)} rows")

        # Create a test leaf image
        img = Image.new("RGB", (256, 256), color=(34, 139, 34))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        jpeg_bytes = buf.getvalue()

        print("Testing /api/predict...")
        r = client.post(
            "/api/predict",
            files={"file": ("leaf.jpg", jpeg_bytes, "image/jpeg")},
        )
        assert r.status_code == 200, r.text
        pred = r.json()
        assert "predictions" in pred
        assert len(pred["predictions"]) == 6
        assert pred["model_order"] == [
            "baseline",
            "hue_only",
            "saturation_only",
            "brightness_only",
            "broad_colorjitter",
            "all_factor",
        ]
        for m in pred["model_order"]:
            assert m in pred["predictions"]
            assert "class_name" in pred["predictions"][m]
            assert 0.0 <= pred["predictions"][m]["confidence"] <= 1.0
        print(f"  Predict OK: baseline={pred['predictions']['baseline']}")

        print("Testing /api/augment-preview (neutral)...")
        r = client.post(
            "/api/augment-preview",
            files={"file": ("leaf.jpg", jpeg_bytes, "image/jpeg")},
            data={"hue": 0.0, "saturation": 1.0, "brightness": 1.0},
        )
        assert r.status_code == 200, r.text
        assert "preview_base64" in r.json()
        print("  Augment preview neutral OK")

        print("Testing /api/augment-preview (distorted)...")
        r = client.post(
            "/api/augment-preview",
            files={"file": ("leaf.jpg", jpeg_bytes, "image/jpeg")},
            data={"hue": 0.2, "saturation": 1.5, "brightness": 0.8},
        )
        assert r.status_code == 200, r.text
        assert "preview_base64" in r.json()
        print("  Augment preview distorted OK")

        print("Testing validation errors...")
        # 1. Invalid content type -> 415
        r = client.post(
            "/api/predict",
            files={"file": ("test.txt", b"hello world", "text/plain")},
        )
        assert r.status_code == 415, r.status_code
        assert r.json()["detail"] == "Upload JPG, PNG or WEBP."
        print("  415 Media Type validation OK")

        # 2. Oversized image (>8MB) -> 413
        oversized = b"0" * (9 * 1024 * 1024)
        r = client.post(
            "/api/predict",
            files={"file": ("big.jpg", oversized, "image/jpeg")},
        )
        assert r.status_code == 413, r.status_code
        assert r.json()["detail"] == "Image must be 8 MB or smaller."
        print("  413 Payload Too Large validation OK")

        # 3. Corrupted image -> 400
        r = client.post(
            "/api/predict",
            files={"file": ("corrupt.jpg", b"not-a-valid-image", "image/jpeg")},
        )
        assert r.status_code == 400, r.status_code
        assert r.json()["detail"] == "Invalid image."
        print("  400 Corrupt Image validation OK")

    print("\nALL BACKEND TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    test_all()

