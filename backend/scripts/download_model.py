from pathlib import Path
from urllib.request import urlretrieve

MODEL_URL = "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8s.pt"


def main() -> None:
    """Download the official pretrained YOLOv8 Small weights into the project."""
    model_dir = Path("models")
    model_dir.mkdir(parents=True, exist_ok=True)
    target = model_dir / "yolov8s.pt"
    if target.exists():
        print(f"Model already available at {target}")
        return

    print("Downloading official Ultralytics YOLOv8 Small weights...")
    urlretrieve(MODEL_URL, target)
    print(f"Downloaded pretrained model to {target}")


if __name__ == "__main__":
    main()
