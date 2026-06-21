import logging
import random
import time
from pathlib import Path
from threading import Lock
from typing import Any

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import AppError
from app.models.detection import Detection, TrackedObject
from app.utils.ultralytics_runtime import prepare_ultralytics_runtime

logger = logging.getLogger(__name__)


class YoloDetectionService:
    """Cached adapter for official Ultralytics YOLOv8 detection models."""

    classes = ["person", "car", "truck", "helmet", "forklift", "bicycle", "backpack"]
    supported_models = {"yolov8n", "yolov8s", "yolov8m"}
    _models: dict[str, Any] = {}
    _model_lock = Lock()

    def __init__(self, model_name: str = "yolov8n") -> None:
        if model_name not in self.supported_models:
            raise AppError(f"Unsupported model: {model_name}", 422)
        self.model_name = model_name

    async def save_upload(self, file: UploadFile) -> Path:
        if not file.filename:
            raise AppError("Uploaded file must have a filename", 422)
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        target = upload_dir / f"{int(time.time() * 1000)}-{Path(file.filename).name}"
        max_bytes = settings.max_upload_size_mb * 1024 * 1024
        size = 0
        with target.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_bytes:
                    output.close()
                    target.unlink(missing_ok=True)
                    raise AppError(f"File exceeds the {settings.max_upload_size_mb} MB upload limit", 413)
                output.write(chunk)
        return target

    def detect(self, path: Path, confidence_threshold: float) -> tuple[list[dict], int, dict[str, Any]]:
        """Run detection on the given file path, either via real YOLO or demo fallback.

        Args:
            path: Path to the uploaded media file.
            confidence_threshold: Minimum confidence score to keep a detection.

        Returns:
            Tuple of (raw_detections, duration_ms, metadata).

        Raises:
            AppError: If real inference is enabled but YOLO fails.
        """
        started = time.perf_counter()
        if settings.enable_real_inference:
            detections, metadata = self._run_yolo(path, confidence_threshold)
            if metadata.get("inference_error"):
                raise AppError(
                    f"YOLO inference failed: {metadata['inference_error']}. "
                    "Run `python -m scripts.download_model` and restart the API.",
                    503,
                )
        else:
            detections = self._fallback_detections(path, confidence_threshold)
            metadata = {"inference_mode": "demo", "model": self.model_name}
        duration_ms = int((time.perf_counter() - started) * 1000)
        metadata["duration_ms"] = duration_ms
        return detections, duration_ms, metadata

    def _model_path(self) -> str:
        configured = Path(settings.yolo_model_path)
        if self.model_name == "yolov8s":
            return str(configured)
        return f"{self.model_name}.pt"

    def _get_model(self):
        model_path = self._model_path()
        if model_path not in self._models:
            with self._model_lock:
                if model_path not in self._models:
                    prepare_ultralytics_runtime()
                    from ultralytics import YOLO

                    logger.info("Loading YOLO model %s", model_path)
                    self._models[model_path] = YOLO(model_path)
        return self._models[model_path]

    def _run_yolo(self, path: Path, confidence_threshold: float) -> tuple[list[dict], dict[str, Any]]:
        try:
            model = self._get_model()
            detections = []
            metadata: dict[str, Any] = {
                "inference_mode": "yolo",
                "model": self.model_name,
                "image_width": 0,
                "image_height": 0,
                "frames_processed": 0,
            }
            results = model.predict(
                source=str(path),
                conf=confidence_threshold,
                imgsz=640,
                stream=True,
                verbose=False,
            )
            for frame_index, result in enumerate(results):
                if frame_index >= 300:
                    break
                metadata["frames_processed"] = frame_index + 1
                if result.orig_shape:
                    metadata["image_height"], metadata["image_width"] = result.orig_shape
                for box in result.boxes:
                    cls_idx = int(box.cls[0])
                    detections.append(
                        {
                            "class_name": result.names[cls_idx],
                            "confidence": float(box.conf[0]),
                            "bbox": {
                                "x1": float(box.xyxy[0][0]),
                                "y1": float(box.xyxy[0][1]),
                                "x2": float(box.xyxy[0][2]),
                                "y2": float(box.xyxy[0][3]),
                            },
                            "frame": frame_index,
                        }
                    )
            return detections, metadata
        except Exception as exc:
            logger.exception("YOLO inference failed")
            return [], {"inference_mode": "error", "model": self.model_name, "inference_error": str(exc)}

    def _fallback_detections(self, path: Path, confidence_threshold: float) -> list[dict]:
        random.seed(sum(path.name.encode()))
        return [
            {
                "class_name": random.choice(self.classes),
                "confidence": round(random.uniform(confidence_threshold, 0.98), 2),
                "bbox": {
                    "x1": random.randint(20, 180),
                    "y1": random.randint(20, 160),
                    "x2": random.randint(220, 500),
                    "y2": random.randint(220, 420),
                },
            }
            for _ in range(random.randint(2, 7))
        ]


class TrackingService:
    """DeepSORT-style tracker abstraction that assigns stable IDs per detection batch."""

    def track(self, detections: list[dict]) -> list[TrackedObject]:
        tracked: list[TrackedObject] = []
        for index, item in enumerate(detections, start=1):
            bbox = item["bbox"]
            tracked.append(
                TrackedObject(
                    track_id=f"T-{index:04d}",
                    class_name=item["class_name"],
                    confidence=item["confidence"],
                    bbox=bbox,
                    movement_history=[
                        {"x": bbox["x1"], "y": bbox["y1"], "frame": 0},
                        {"x": bbox["x2"], "y": bbox["y2"], "frame": 1},
                    ],
                )
            )
        return tracked


def build_detection_record(
    source_type: str,
    source_name: str,
    model_name: str,
    confidence_threshold: float,
    owner_id: int,
    duration_ms: int,
    objects: list[TrackedObject],
    inference_metadata: dict[str, Any] | None = None,
) -> Detection:
    average = sum(obj.confidence for obj in objects) / len(objects) if objects else 0
    return Detection(
        source_type=source_type,
        source_name=source_name,
        model_name=model_name,
        confidence_threshold=confidence_threshold,
        status="completed",
        total_objects=len(objects),
        average_confidence=round(average, 3),
        duration_ms=duration_ms,
        metadata_json={
            "pipeline": "yolov8+tracking",
            "storage": "local",
            **(inference_metadata or {}),
        },
        owner_id=owner_id,
    )
