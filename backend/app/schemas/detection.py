from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TrackedObjectRead(BaseModel):
    id: int
    track_id: str
    class_name: str
    confidence: float
    bbox: dict[str, float]
    movement_history: list[dict[str, float]]

    model_config = {"from_attributes": True}


class DetectionRead(BaseModel):
    id: int
    source_type: str
    source_name: str
    model_name: str
    confidence_threshold: float
    status: str
    total_objects: int
    average_confidence: float
    duration_ms: int
    metadata_json: dict[str, Any]
    created_at: datetime
    tracked_objects: list[TrackedObjectRead] = []

    model_config = {"from_attributes": True}


class DetectionList(BaseModel):
    items: list[DetectionRead]
    total: int
    page: int
    page_size: int


class DetectionQuery(BaseModel):
    search: str | None = None
    class_name: str | None = None
    source_type: str | None = None
    sort: str = "-created_at"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
