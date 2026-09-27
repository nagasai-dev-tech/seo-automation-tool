from datetime import datetime, timezone
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import SchedulerSetting
from app.services.job_service import create_and_start_job
from app.services.report_service import generate_weekly_reports_all_brands

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def run_scheduled_rank_check():
    """
    Scheduled job executed on Monday 06:00 AM (or user-defined schedule).
    Runs automated rank check across all websites, updates changes, triggers alerts,
    and generates weekly reports.
    """
    logger.info("Executing scheduled Monday SEO Rank Check Automation...")
    db: Session = SessionLocal()
    try:
        # Start a master job for all active websites
        job = create_and_start_job(db, website_id=None, brand_id=None)
        logger.info(f"Scheduled rank check job #{job.id} dispatched.")

        # Generate weekly reports
        generate_weekly_reports_all_brands(db)
        logger.info("Scheduled weekly reports generated successfully.")
    except Exception as e:
        logger.error(f"Error during scheduled rank check run: {e}")
    finally:
        db.close()


def init_scheduler():
    """
    Initializes or updates the APScheduler cron job from DB settings or environment defaults.
    """
    db: Session = SessionLocal()
    try:
        setting = db.query(SchedulerSetting).first()
        if not setting:
            setting = SchedulerSetting(
                day_of_week=settings.DEFAULT_SCHEDULE_DAY,
                time_str=settings.DEFAULT_SCHEDULE_TIME,
                timezone=settings.DEFAULT_SCHEDULE_TIMEZONE,
                frequency="weekly",
                is_active=True
            )
            db.add(setting)
            db.commit()
            db.refresh(setting)

        # Parse hour and minute
        parts = setting.time_str.split(":")
        hour = int(parts[0]) if len(parts) > 0 else 6
        minute = int(parts[1]) if len(parts) > 1 else 0

        # Remove existing job if any
        if scheduler.get_job("weekly_rank_check"):
            scheduler.remove_job("weekly_rank_check")

        if setting.is_active:
            trigger = CronTrigger(
                day_of_week=setting.day_of_week.lower(),
                hour=hour,
                minute=minute,
                timezone=setting.timezone
            )
            scheduler.add_job(
                run_scheduled_rank_check,
                trigger=trigger,
                id="weekly_rank_check",
                replace_existing=True
            )
            logger.info(
                f"Monday automation scheduled: Day={setting.day_of_week}, "
                f"Time={setting.time_str}, TZ={setting.timezone}"
            )

        if not scheduler.running:
            scheduler.start()
    except Exception as e:
        logger.warning(f"Could not initialize scheduler: {e}")
    finally:
        db.close()


def update_scheduler_job(
    day_of_week: str,
    time_str: str,
    tz_str: str,
    is_active: bool = True
):
    """
    Updates the running APScheduler job dynamically.
    """
    parts = time_str.split(":")
    hour = int(parts[0]) if len(parts) > 0 else 6
    minute = int(parts[1]) if len(parts) > 1 else 0

    if scheduler.get_job("weekly_rank_check"):
        scheduler.remove_job("weekly_rank_check")

    if is_active:
        trigger = CronTrigger(
            day_of_week=day_of_week.lower(),
            hour=hour,
            minute=minute,
            timezone=tz_str
        )
        scheduler.add_job(
            run_scheduled_rank_check,
            trigger=trigger,
            id="weekly_rank_check",
            replace_existing=True
        )
