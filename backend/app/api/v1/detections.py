"""Detection endpoints — image, video, webcam upload and history queries."""
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.exceptions import AppError
from app.database.session import get_db
from app.models.user import User
from app.repositories.detections import DetectionRepository
from app.schemas.detection import DetectionList, DetectionQuery, DetectionRead
from app.services.alerts import AlertService
from app.services.detection import TrackingService, YoloDetectionService, build_detection_record

router = APIRouter()


@router.post("/image", response_model=DetectionRead)
async def detect_image(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.5),
    model_name: str = Form("yolov8n"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    detector = YoloDetectionService(model_name)
    path = await detector.save_upload(file)
    raw, duration_ms, metadata = detector.detect(path, confidence_threshold)
    objects = TrackingService().track(raw)
    detection = build_detection_record(
        "image",
        file.filename or path.name,
        model_name,
        confidence_threshold,
        user.id,
        duration_ms,
        objects,
        metadata,
    )
    saved = DetectionRepository(db).create(detection, objects)
    AlertService(db).evaluate(saved)
    return saved


@router.post("/video", response_model=DetectionRead)
async def detect_video(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.5),
    model_name: str = Form("yolov8n"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    detector = YoloDetectionService(model_name)
    path = await detector.save_upload(file)
    raw, duration_ms, metadata = detector.detect(path, confidence_threshold)
    objects = TrackingService().track(raw)
    detection = build_detection_record(
        "video",
        file.filename or path.name,
        model_name,
        confidence_threshold,
        user.id,
        duration_ms,
        objects,
        metadata,
    )
    return DetectionRepository(db).create(detection, objects)


@router.post("/webcam", response_model=DetectionRead)
async def detect_webcam_frame(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.5),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    detector = YoloDetectionService("yolov8n")
    path = await detector.save_upload(file)
    raw, duration_ms, metadata = detector.detect(path, confidence_threshold)
    objects = TrackingService().track(raw)
    detection = build_detection_record(
        "webcam",
        "Live camera frame",
        "yolov8n",
        confidence_threshold,
        user.id,
        duration_ms,
        objects,
        metadata,
    )
    return DetectionRepository(db).create(detection, objects)


@router.get("", response_model=DetectionList)
def list_detections(
    search: str | None = None,
    class_name: str | None = None,
    source_type: str | None = None,
    sort: str = "-created_at",
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = DetectionQuery(search=search, class_name=class_name, source_type=source_type, sort=sort, page=page, page_size=page_size)
    items, total = DetectionRepository(db).list(query, None if user.role == "admin" else user.id)
    return DetectionList(items=items, total=total, page=page, page_size=page_size)


@router.get("/{detection_id}", response_model=DetectionRead)
def get_detection(detection_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Retrieve a single detection record by ID."""
    detection = DetectionRepository(db).get(detection_id)
    if detection is None:
        raise AppError("Detection not found", status.HTTP_404_NOT_FOUND)
    return detection


@router.delete("/{detection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_detection(
    detection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    """Delete a detection record.

    Regular users may only delete their own records.
    Admins may delete any record.
    """
    repo = DetectionRepository(db)
    detection = repo.get(detection_id)
    if detection is None:
        raise AppError("Detection not found", status.HTTP_404_NOT_FOUND)
    if user.role != "admin" and detection.owner_id != user.id:
        raise AppError("Insufficient permissions", status.HTTP_403_FORBIDDEN)
    repo.delete(detection)
