"""Report generation endpoints — CSV, XLSX, and PDF downloads."""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.detection import Detection
from app.models.user import User
from app.services.reports import ReportService

router = APIRouter()

_REPORT_LIMIT = 5000


def _detections(db: Session, user: User):
    """Fetch up to 5000 detections scoped to the current user (admins see all)."""
    q = db.query(Detection).options(selectinload(Detection.tracked_objects))
    if user.role != "admin":
        q = q.filter(Detection.owner_id == user.id)
    return q.order_by(Detection.created_at.desc()).limit(_REPORT_LIMIT).all()


@router.get("/detections.csv")
def csv_report(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Download detection history as a CSV file."""
    return Response(
        ReportService().csv(_detections(db, user)),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=detections.csv"},
    )


@router.get("/detections.xlsx")
def xlsx_report(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Download detection history as an Excel spreadsheet."""
    return Response(
        ReportService().xlsx(_detections(db, user)),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=detections.xlsx"},
    )


@router.get("/detections.pdf")
def pdf_report(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Download detection history as a PDF report."""
    return Response(
        ReportService().pdf(_detections(db, user)),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=detections.pdf"},
    )
