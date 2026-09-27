from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import RankCheckJob, Website, Brand, User
from app.schemas.schemas import RankCheckJobOut, JobRunRequest
from app.api.deps import get_current_user
from app.services.job_service import create_and_start_job

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[RankCheckJobOut])
def list_jobs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    jobs = (
        db.query(RankCheckJob)
        .order_by(RankCheckJob.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for j in jobs:
        w_domain = None
        b_name = None
        if j.website_id:
            w = db.query(Website).filter(Website.id == j.website_id).first()
            if w:
                w_domain = w.domain
                b_name = w.brand.name if w.brand else None
        elif j.brand_id:
            b = db.query(Brand).filter(Brand.id == j.brand_id).first()
            if b:
                b_name = b.name

        result.append({
            **j.__dict__,
            "website_domain": w_domain,
            "brand_name": b_name
        })
    return result


@router.post("/run", response_model=RankCheckJobOut, status_code=status.HTTP_201_CREATED)
def trigger_job(
    req: JobRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    job = create_and_start_job(db, website_id=req.website_id, brand_id=req.brand_id)
    w_domain = None
    b_name = None
    if job.website_id:
        w = db.query(Website).filter(Website.id == job.website_id).first()
        if w:
            w_domain = w.domain
            b_name = w.brand.name if w.brand else None
    elif job.brand_id:
        b = db.query(Brand).filter(Brand.id == job.brand_id).first()
        if b:
            b_name = b.name

    return {
        **job.__dict__,
        "website_domain": w_domain,
        "brand_name": b_name
    }


@router.get("/{job_id}", response_model=RankCheckJobOut)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    job = db.query(RankCheckJob).filter(RankCheckJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    w_domain = None
    b_name = None
    if job.website_id:
        w = db.query(Website).filter(Website.id == job.website_id).first()
        if w:
            w_domain = w.domain
            b_name = w.brand.name if w.brand else None
    elif job.brand_id:
        b = db.query(Brand).filter(Brand.id == job.brand_id).first()
        if b:
            b_name = b.name

    return {
        **job.__dict__,
        "website_domain": w_domain,
        "brand_name": b_name
    }


@router.post("/{job_id}/cancel", response_model=RankCheckJobOut)
def cancel_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    job = db.query(RankCheckJob).filter(RankCheckJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status in ("queued", "running"):
        job.status = "cancelled"
        db.commit()
        db.refresh(job)

    return job


@router.post("/{job_id}/retry", response_model=RankCheckJobOut)
def retry_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    old_job = db.query(RankCheckJob).filter(RankCheckJob.id == job_id).first()
    if not old_job:
        raise HTTPException(status_code=404, detail="Job not found")

    new_job = create_and_start_job(db, website_id=old_job.website_id, brand_id=old_job.brand_id)
    return new_job
