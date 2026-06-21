"""Alert management endpoints — rules and events."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.exceptions import AppError
from app.database.session import get_db
from app.models.user import User
from app.repositories.alerts import AlertRepository
from app.schemas.alert import AlertEventRead, AlertRuleCreate, AlertRuleRead

router = APIRouter()


def _repo(db: Session) -> AlertRepository:
    """Dependency: returns an AlertRepository for *db*."""
    return AlertRepository(db)


@router.get("/rules", response_model=list[AlertRuleRead])
def list_rules(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list:
    """Return all alert rules belonging to the authenticated user."""
    return _repo(db).list_rules(user.id)


@router.post("/rules", response_model=AlertRuleRead, status_code=status.HTTP_201_CREATED)
def create_rule(
    payload: AlertRuleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> object:
    """Create a new alert rule for the authenticated user."""
    return _repo(db).create_rule(payload.model_dump(mode="json"), user.id)


@router.patch("/rules/{rule_id}", response_model=AlertRuleRead)
def update_rule(
    rule_id: int,
    payload: AlertRuleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> object:
    """Update an existing rule (must belong to the authenticated user)."""
    repo = _repo(db)
    rule = repo.get_rule(rule_id, user.id)
    if rule is None:
        raise AppError("Alert rule not found", status.HTTP_404_NOT_FOUND)
    return repo.update_rule(rule, payload.model_dump(mode="json"))


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    """Delete an alert rule (must belong to the authenticated user)."""
    repo = _repo(db)
    rule = repo.get_rule(rule_id, user.id)
    if rule is None:
        raise AppError("Alert rule not found", status.HTTP_404_NOT_FOUND)
    repo.delete_rule(rule)


@router.get("/events", response_model=list[AlertEventRead])
def list_events(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list:
    """Return recent alert events for the authenticated user's rules."""
    return _repo(db).list_events(user.id)
