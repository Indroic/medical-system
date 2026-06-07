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
    import config
    from src.features.analizador.domain.events import AnalisisCompletadoEvent
    from src.features.estudios.application.handlers import on_analisis_completado_update_estudio
    from src.features.reportes.application.handlers import on_analisis_completado

    dispatcher = config.config.event_dispatcher
    dispatcher.register(AnalisisCompletadoEvent, on_analisis_completado)
    dispatcher.register(AnalisisCompletadoEvent, on_analisis_completado_update_estudio)
