"""Report generation service — CSV, Excel (XLSX), and PDF output."""
import csv
from io import BytesIO, StringIO

import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.models.detection import Detection

# PDF layout constants
_PAGE_WIDTH, _PAGE_HEIGHT = letter
_MARGIN = 72  # 1-inch margins
_LINE_HEIGHT = 18
_HEADER_Y = _PAGE_HEIGHT - _MARGIN
_FIRST_ROW_Y = _HEADER_Y - 40
_BOTTOM_MARGIN = _MARGIN + _LINE_HEIGHT


class ReportService:
    """Generates CSV, XLSX, and PDF reports from a list of Detection records."""

    def csv(self, detections: list[Detection]) -> str:
        """Return detections serialised as a CSV string."""
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "source", "type", "objects", "avg_confidence", "model", "status", "created_at"])
        for item in detections:
            writer.writerow([
                item.id,
                item.source_name,
                item.source_type,
                item.total_objects,
                round(item.average_confidence, 4),
                item.model_name,
                item.status,
                item.created_at.isoformat() if item.created_at else "",
            ])
        return output.getvalue()

    def xlsx(self, detections: list[Detection]) -> bytes:
        """Return detections serialised as an XLSX workbook."""
        rows = [
            {
                "id": item.id,
                "source": item.source_name,
                "type": item.source_type,
                "objects": item.total_objects,
                "avg_confidence": round(item.average_confidence, 4),
                "model": item.model_name,
                "status": item.status,
                "created_at": item.created_at,
            }
            for item in detections
        ]
        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            pd.DataFrame(rows).to_excel(writer, index=False, sheet_name="Detections")
        return output.getvalue()

    def pdf(self, detections: list[Detection]) -> bytes:
        """Return detections as a multi-page PDF report.

        Previously capped at 35 rows — now paginates automatically so no
        records are silently truncated.
        """
        output = BytesIO()
        pdf = canvas.Canvas(output, pagesize=letter)
        pdf.setTitle("Hawkvision Detection Report")

        def _draw_page_header() -> float:
            """Draw the report header and return the starting y position for rows."""
            pdf.setFont("Helvetica-Bold", 16)
            pdf.drawString(_MARGIN, _HEADER_Y, "Hawkvision Detection Report")
            pdf.setFont("Helvetica-Bold", 9)
            pdf.setFillColorRGB(0.5, 0.5, 0.5)
            pdf.drawString(_MARGIN, _HEADER_Y - 22, f"Total records: {len(detections)}")
            pdf.setFillColorRGB(0, 0, 0)
            pdf.setFont("Helvetica", 10)
            return _FIRST_ROW_Y

        y = _draw_page_header()

        for item in detections:
            if y < _BOTTOM_MARGIN:
                pdf.showPage()
                y = _draw_page_header()
            label = (
                f"#{item.id}  {item.source_name[:40]}  —  "
                f"{item.total_objects} obj  "
                f"conf {item.average_confidence:.2f}  "
                f"[{item.source_type}]"
            )
            pdf.drawString(_MARGIN, y, label)
            y -= _LINE_HEIGHT

        pdf.showPage()
        pdf.save()
        return output.getvalue()
