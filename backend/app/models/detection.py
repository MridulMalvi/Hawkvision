from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_type: Mapped[str] = mapped_column(String(32))
    source_name: Mapped[str] = mapped_column(String(255))
    model_name: Mapped[str] = mapped_column(String(80))
    confidence_threshold: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="completed")
    total_objects: Mapped[int] = mapped_column(Integer, default=0)
    average_confidence: Mapped[float] = mapped_column(Float, default=0)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="detections")
    tracked_objects = relationship("TrackedObject", cascade="all, delete-orphan", back_populates="detection")


class TrackedObject(Base):
    __tablename__ = "tracked_objects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    detection_id: Mapped[int] = mapped_column(ForeignKey("detections.id", ondelete="CASCADE"))
    track_id: Mapped[str] = mapped_column(String(64))
    class_name: Mapped[str] = mapped_column(String(80))
    confidence: Mapped[float] = mapped_column(Float)
    bbox: Mapped[dict[str, float]] = mapped_column(JSON)
    movement_history: Mapped[list[dict[str, float]]] = mapped_column(JSON, default=list)

    detection = relationship("Detection", back_populates="tracked_objects")
