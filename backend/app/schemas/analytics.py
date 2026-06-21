from pydantic import BaseModel


class TrendPoint(BaseModel):
    date: str
    detections: int


class ClassCount(BaseModel):
    class_name: str
    count: int


class AnalyticsSummary(BaseModel):
    total_detections: int
    total_objects: int
    average_confidence: float
    most_detected_classes: list[ClassCount]
    trends: list[TrendPoint]
