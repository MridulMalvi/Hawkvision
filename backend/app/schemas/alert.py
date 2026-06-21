from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class AlertRuleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    class_name: str = Field(min_length=1, max_length=80)
    min_confidence: float = Field(default=0.75, ge=0, le=1)
    email_recipients: list[EmailStr] = []
    is_active: bool = True


class AlertRuleRead(AlertRuleCreate):
    id: int
    owner_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertEventRead(BaseModel):
    id: int
    rule_id: int
    detection_id: int
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}
