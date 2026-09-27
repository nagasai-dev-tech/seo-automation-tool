import logging
from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.job_service import execute_job_process
from app.services.report_service import generate_weekly_reports_all_brands

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.run_rank_check_job")
def run_rank_check_job_task(job_id: int):
    """
    Celery task to run a rank check job asynchronously via worker.
    """
    logger.info(f"Celery worker picked up rank check job #{job_id}")
    execute_job_process(job_id)
    return {"status": "completed", "job_id": job_id}


@celery_app.task(name="tasks.scheduled_monday_run")
def scheduled_monday_run_task():
    """
    Celery beat scheduled task for Monday 06:00 AM check.
    """
    logger.info("Celery beat triggering Monday rank check and report generation...")
    db = SessionLocal()
    try:
        from app.services.job_service import create_and_start_job
        job = create_and_start_job(db)
        generate_weekly_reports_all_brands(db)
        return {"status": "success", "job_id": job.id}
    finally:
        db.close()
