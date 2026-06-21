import logging
import smtplib
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.alert import AlertEvent, AlertRule
from app.models.detection import Detection

logger = logging.getLogger(__name__)


class AlertService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def evaluate(self, detection: Detection) -> None:
        rules = self.db.query(AlertRule).filter(AlertRule.is_active.is_(True)).all()
        for rule in rules:
            matches = [
                obj for obj in detection.tracked_objects if obj.class_name == rule.class_name and obj.confidence >= rule.min_confidence
            ]
            if matches:
                message = f"{len(matches)} {rule.class_name} object(s) detected in {detection.source_name}"
                event = AlertEvent(rule_id=rule.id, detection_id=detection.id, message=message)
                self.db.add(event)
                self._send_email(rule.email_recipients, message)
        self.db.commit()

    def _send_email(self, recipients: list[str], message: str) -> None:
        if not settings.smtp_host or not recipients:
            logger.info("Alert email skipped: %s", message)
            return
        email = EmailMessage()
        email["From"] = settings.smtp_from
        email["To"] = ", ".join(recipients)
        email["Subject"] = "Hawkvision alert"
        email.set_content(message)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            smtp.starttls()
            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(email)
