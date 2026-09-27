import os
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Report, Brand, User
from app.schemas.schemas import ReportOut, ReportGenerateRequest
from app.api.deps import get_current_user
from app.services.report_service import create_weekly_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=List[ReportOut])
def list_reports(
    brand_id: Optional[int] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    query = db.query(Report)
    if brand_id:
        query = query.filter(Report.brand_id == brand_id)
    reports = query.order_by(Report.created_at.desc()).limit(limit).all()

    result = []
    for r in reports:
        b_name = "All Brands"
        if r.brand_id:
            b = db.query(Brand).filter(Brand.id == r.brand_id).first()
            if b:
                b_name = b.name
        result.append({
            "id": r.id,
            "brand_id": r.brand_id,
            "brand_name": b_name,
            "report_type": r.report_type,
            "period_start": r.period_start,
            "period_end": r.period_end,
            "file_url": r.file_url,
            "created_at": r.created_at
        })
    return result


@router.post("/generate", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def trigger_report_generation(
    req: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    report = create_weekly_report(
        db,
        brand_id=req.brand_id,
        period_start=req.period_start,
        period_end=req.period_end
    )
    b_name = "All Brands"
    if report.brand_id:
        b = db.query(Brand).filter(Brand.id == report.brand_id).first()
        if b:
            b_name = b.name

    return {
        "id": report.id,
        "brand_id": report.brand_id,
        "brand_name": b_name,
        "report_type": report.report_type,
        "period_start": report.period_start,
        "period_end": report.period_end,
        "file_url": report.file_url,
        "created_at": report.created_at
    }


@router.get("/download/{filename}")
def download_pdf_report(filename: str):
    reports_dir = os.path.join(os.getcwd(), "uploads", "reports")
    file_path = os.path.join(reports_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename
    )


@router.get("/{report_id}")
def get_report_detail(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    b_name = "All Brands"
    if report.brand_id:
        b = db.query(Brand).filter(Brand.id == report.brand_id).first()
        if b:
            b_name = b.name

    return {
        "id": report.id,
        "brand_id": report.brand_id,
        "brand_name": b_name,
        "report_type": report.report_type,
        "period_start": report.period_start,
        "period_end": report.period_end,
        "file_url": report.file_url,
        "data": report.data_json,
        "created_at": report.created_at
    }
