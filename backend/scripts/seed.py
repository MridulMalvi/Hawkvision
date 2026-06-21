from app.core.security import hash_password
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models.alert import AlertRule
from app.models.detection import Detection, TrackedObject
from app.models.user import User


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if not db.query(User).filter(User.email == "admin@hawkvision.ai").first():
        admin = User(
            email="admin@hawkvision.ai",
            full_name="Hawkvision Admin",
            hashed_password=hash_password("Admin123!"),
            role="admin",
        )
        analyst = User(
            email="analyst@hawkvision.ai",
            full_name="Operations Analyst",
            hashed_password=hash_password("Analyst123!"),
            role="user",
        )
        db.add_all([admin, analyst])
        db.commit()
        db.refresh(admin)
        detection = Detection(
            source_type="video",
            source_name="warehouse-zone-a.mp4",
            model_name="yolov8n",
            confidence_threshold=0.55,
            status="completed",
            total_objects=3,
            average_confidence=0.86,
            duration_ms=1204,
            metadata_json={"pipeline": "seed"},
            owner_id=admin.id,
        )
        detection.tracked_objects = [
            TrackedObject(
                track_id="T-0001",
                class_name="person",
                confidence=0.91,
                bbox={"x1": 20, "y1": 30, "x2": 180, "y2": 280},
                movement_history=[],
            ),
            TrackedObject(
                track_id="T-0002",
                class_name="forklift",
                confidence=0.84,
                bbox={"x1": 220, "y1": 90, "x2": 480, "y2": 330},
                movement_history=[],
            ),
            TrackedObject(
                track_id="T-0003",
                class_name="helmet",
                confidence=0.83,
                bbox={"x1": 70, "y1": 20, "x2": 110, "y2": 60},
                movement_history=[],
            ),
        ]
        db.add(detection)
        db.add(
            AlertRule(
                name="High confidence person",
                class_name="person",
                min_confidence=0.8,
                email_recipients=[],
                owner_id=admin.id,
            )
        )
        db.commit()
    db.close()


if __name__ == "__main__":
    main()
