import os

from celery import Celery

# Importar todos los modelos ORM antes de que cualquier tarea ejecute una
# query. Los modelos se referencian entre sí por nombre de clase en sus
# relationship() (p. ej. AnalisisModel -> "EstudioModel"), y SQLAlchemy solo
# puede resolver esos nombres si la clase ya fue importada en este proceso.
# El proceso de Celery es independiente del de FastAPI (main.py), que sí
# importa los cinco a propósito: sin esto, el worker crashea con
# "InvalidRequestError: ... failed to locate a name" al primer query.
import src.features.analizador.infrastructure.models  # noqa: F401
import src.features.estudios.infrastructure.models  # noqa: F401
import src.features.pacientes.infrastructure.models  # noqa: F401
import src.features.reportes.infrastructure.models  # noqa: F401
import src.features.usuarios.infrastructure.models  # noqa: F401

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
