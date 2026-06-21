"""Detection repository — data access for Detection and TrackedObject records."""
from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models.detection import Detection, TrackedObject
from app.schemas.detection import DetectionQuery


class DetectionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, detection: Detection, objects: list[TrackedObject]) -> Detection:
        detection.tracked_objects = objects
        self.db.add(detection)
        self.db.commit()
        self.db.refresh(detection)
        return detection

    def get(self, detection_id: int) -> Detection | None:
        return self.db.query(Detection).options(selectinload(Detection.tracked_objects)).filter(Detection.id == detection_id).first()

    def list(self, query: DetectionQuery, owner_id: int | None = None) -> tuple[list[Detection], int]:
        statement = self.db.query(Detection).options(selectinload(Detection.tracked_objects))
        if owner_id:
            statement = statement.filter(Detection.owner_id == owner_id)
        if query.search:
            statement = statement.filter(Detection.source_name.ilike(f"%{query.search}%"))
        if query.source_type:
            statement = statement.filter(Detection.source_type == query.source_type)
        if query.class_name:
            statement = statement.join(TrackedObject).filter(TrackedObject.class_name == query.class_name)
        total = statement.count()
        sort_column = Detection.created_at
        if query.sort.lstrip("-") == "total_objects":
            sort_column = Detection.total_objects
        if query.sort.startswith("-"):
            sort_column = sort_column.desc()
        items = statement.order_by(sort_column).offset((query.page - 1) * query.page_size).limit(query.page_size).all()
        return items, total

    def delete(self, detection: Detection) -> None:
        """Delete *detection* and all its tracked objects (cascade)."""
        self.db.delete(detection)
        self.db.commit()

    def class_counts(self) -> list[tuple[str, int]]:
        """Return the top-8 most detected classes across all records."""
        return (
            self.db.query(TrackedObject.class_name, func.count(TrackedObject.id))
            .group_by(TrackedObject.class_name)
            .order_by(func.count(TrackedObject.id).desc())
            .limit(8)
            .all()
        )
