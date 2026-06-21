# Pretrained model

Run this command from `backend/` to download the official Ultralytics YOLOv8 Small COCO weights:

```bash
python -m scripts.download_model
```

The resulting `models/yolov8s.pt` file is loaded once and cached across inference requests.
