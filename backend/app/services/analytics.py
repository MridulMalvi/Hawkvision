"""Analytics service — computes detection summaries and trend data."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.detection import Detection, TrackedObject
from app.schemas.analytics import AnalyticsSummary, ClassCount, TrendPoint


class AnalyticsRepository:
    """Low-level analytics queries, separate from CRUD operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def total_detections(self) -> int:
        """Return the total number of detection records."""
        return self.db.query(func.count(Detection.id)).scalar() or 0

    def total_objects(self) -> int:
        """Return the sum of all objects detected across all records."""
        return int(self.db.query(func.coalesce(func.sum(Detection.total_objects), 0)).scalar() or 0)

    def average_confidence(self) -> float:
        """Return the global average confidence across all detection records."""
        return float(self.db.query(func.coalesce(func.avg(Detection.average_confidence), 0)).scalar() or 0)

    def detections_on_day(self, day: str) -> int:
        """Return the detection count for a specific ISO date string (YYYY-MM-DD)."""
        return self.db.query(func.count(Detection.id)).filter(func.date(Detection.created_at) == day).scalar() or 0

    def class_counts(self, limit: int = 8) -> list[tuple[str, int]]:
        """Return the top *limit* detected class names with their counts."""
        return (
            self.db.query(TrackedObject.class_name, func.count(TrackedObject.id))
            .group_by(TrackedObject.class_name)
            .order_by(func.count(TrackedObject.id).desc())
            .limit(limit)
            .all()
        )


class AnalyticsService:
    """Business logic for analytics summaries — depends on AnalyticsRepository."""

    def __init__(self, db: Session) -> None:
        self._repo = AnalyticsRepository(db)

    def summary(self) -> AnalyticsSummary:
        """Build and return a full analytics summary for the dashboard."""
        class_counts = [
            ClassCount(class_name=name, count=count)
            for name, count in self._repo.class_counts()
        ]
        today = datetime.now(timezone.utc).date()
        trends = [
            TrendPoint(
                date=(today - timedelta(days=days_back)).isoformat(),
                detections=self._repo.detections_on_day(
                    str(today - timedelta(days=days_back))
                ),
            )
            for days_back in range(13, -1, -1)
        ]
        return AnalyticsSummary(
            total_detections=self._repo.total_detections(),
            total_objects=self._repo.total_objects(),
            average_confidence=round(self._repo.average_confidence(), 3),
            most_detected_classes=class_counts,
            trends=trends,
        )
