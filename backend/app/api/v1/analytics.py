from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.schemas.analytics import AnalyticsSummary
from app.services.analytics import AnalyticsService

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
def summary(db: Session = Depends(get_db), _=Depends(get_current_user)) -> AnalyticsSummary:
    return AnalyticsService(db).summary()
