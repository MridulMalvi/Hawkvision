"""Report generation endpoints — CSV, XLSX, and PDF downloads."""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.detections import DetectionRepository
from app.schemas.detection import DetectionQuery
from app.services.reports import ReportService

router = APIRouter()


def _detections(db: Session, user: User):
    """Fetch up to 500 detections scoped to the current user (admins see all)."""
    query = DetectionQuery(page_size=500)
    owner_id = None if user.role == "admin" else user.id
    return DetectionRepository(db).list(query, owner_id)[0]


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
