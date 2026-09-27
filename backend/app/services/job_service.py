from datetime import datetime, timezone
import threading
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import RankCheckJob, Keyword, Website, Brand
from app.services.ranking_engine import process_keyword_ranking
from app.providers import get_rank_provider
from app.core.database import SessionLocal


def execute_job_process(job_id: int):
    """
    Background worker thread function that runs rank checks for a job and updates progress.
    """
    db: Session = SessionLocal()
    try:
        job = db.query(RankCheckJob).filter(RankCheckJob.id == job_id).first()
        if not job or job.status == "cancelled":
            return

        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        db.commit()

        # Query keywords to check
        query = db.query(Keyword).filter(Keyword.status == "active")
        if job.website_id:
            query = query.filter(Keyword.website_id == job.website_id)
        elif job.brand_id:
            query = query.join(Website).filter(Website.brand_id == job.brand_id)

        keywords = query.all()
        job.total_keywords = len(keywords)
        db.commit()

        provider = get_rank_provider()

        for kw in keywords:
            # Check if cancelled midway
            db.refresh(job)
            if job.status == "cancelled":
                break

            try:
                process_keyword_ranking(db, kw, provider)
                job.successful += 1
            except Exception as e:
                job.failed += 1
                job.error_message = f"Error checking kw '{kw.keyword}': {str(e)}"
            finally:
                job.processed_keywords += 1
                db.commit()

        db.refresh(job)
        if job.status != "cancelled":
            job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as e:
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()


def create_and_start_job(
    db: Session,
    website_id: Optional[int] = None,
    brand_id: Optional[int] = None
) -> RankCheckJob:
    """
    Creates a new rank check job and triggers background processing.
    """
    # Count keywords
    kw_query = db.query(Keyword).filter(Keyword.status == "active")
    if website_id:
        kw_query = kw_query.filter(Keyword.website_id == website_id)
    elif brand_id:
        kw_query = kw_query.join(Website).filter(Website.brand_id == brand_id)
    total_count = kw_query.count()

    job = RankCheckJob(
        website_id=website_id,
        brand_id=brand_id,
        status="queued",
        total_keywords=total_count,
        processed_keywords=0,
        successful=0,
        failed=0,
        created_at=datetime.now(timezone.utc)
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Launch in background thread for instant responsiveness
    thread = threading.Thread(target=execute_job_process, args=(job.id,), daemon=True)
    thread.start()

    return job
