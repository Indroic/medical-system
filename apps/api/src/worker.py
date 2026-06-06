import os
import src.config  # Importante: Carga config.py para aplicar el monkey-patch de typer
from celery import Celery

broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "medical_system_worker",
    broker=broker_url,
    backend=redis_url,
    include=[
        "src.features.analizador.application.tasks",
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)
