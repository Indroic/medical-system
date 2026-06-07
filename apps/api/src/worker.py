import os

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

from celery.signals import worker_process_init

@worker_process_init.connect
def init_worker(**kwargs):
    # Ya no registramos handlers de eventos aquí.
    # Celery solo publicará el evento al Redis Stream, y FastAPI lo consumirá.
    pass
