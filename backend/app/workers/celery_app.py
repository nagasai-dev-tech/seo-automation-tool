from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "avention_seo",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.celery_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone=settings.DEFAULT_SCHEDULE_TIMEZONE,
    enable_utc=True,
    task_track_started=True,
)
