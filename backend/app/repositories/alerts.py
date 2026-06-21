"""Alert repository — encapsulates all alert-related database queries."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.alert import AlertEvent, AlertRule


class AlertRepository:
    """Repository for alert rules and alert events."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ── Rules ──────────────────────────────────────────────────────────────

    def list_rules(self, owner_id: int) -> list[AlertRule]:
        """Return all alert rules owned by *owner_id*, newest first."""
        return (
            self.db.query(AlertRule)
            .filter(AlertRule.owner_id == owner_id)
            .order_by(AlertRule.created_at.desc())
            .all()
        )

    def get_rule(self, rule_id: int, owner_id: int) -> AlertRule | None:
        """Return a specific rule if it belongs to *owner_id*, else None."""
        return (
            self.db.query(AlertRule)
            .filter(AlertRule.id == rule_id, AlertRule.owner_id == owner_id)
            .first()
        )

    def create_rule(self, payload: dict, owner_id: int) -> AlertRule:
        """Persist a new alert rule and return it."""
        rule = AlertRule(**payload, owner_id=owner_id)
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def update_rule(self, rule: AlertRule, payload: dict) -> AlertRule:
        """Apply *payload* fields to *rule* and persist."""
        for key, value in payload.items():
            setattr(rule, key, value)
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def delete_rule(self, rule: AlertRule) -> None:
        """Delete *rule* and its associated events."""
        self.db.delete(rule)
        self.db.commit()

    # ── Events ─────────────────────────────────────────────────────────────

    def list_events(self, owner_id: int, limit: int = 100) -> list[AlertEvent]:
        """Return recent alert events for rules owned by *owner_id*."""
        return (
            self.db.query(AlertEvent)
            .join(AlertRule, AlertEvent.rule_id == AlertRule.id)
            .filter(AlertRule.owner_id == owner_id)
            .order_by(AlertEvent.created_at.desc())
            .limit(limit)
            .all()
        )
