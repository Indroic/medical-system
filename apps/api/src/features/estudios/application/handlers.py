import logging

from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

import src.shared.infrastructure.database as shared_db
from src.features.analizador.domain.events import AnalisisCompletadoEvent
from src.features.estudios.domain.services import EstudioService
from src.features.estudios.infrastructure.repositories import EstudioRepositoryImpl

logger = logging.getLogger(__name__)

async def on_analisis_completado_update_estudio(event: AnalisisCompletadoEvent) -> None:
    """
    Actualiza el estado del estudio a COMPLETADO cuando el analizador
    finaliza el proceso de inferencia de IA.

    Vía secundaria: la tarea de Celery (`tasks.py::_marcar_estudio`) ya marca
    el estudio como COMPLETADO directamente y es la fuente de verdad. Este
    handler corre en el consumer_loop del proceso de FastAPI (aparte del
    worker) y queda como red de seguridad; marcar_completado() es idempotente,
    así que no hay problema si ambos caminos lo ejecutan. Si esto falla, el
    `try/except` evita perder el mensaje sin log: como el consumer_loop lee
    con `xreadgroup(">")` (solo mensajes nuevos), un mensaje entregado y no
    confirmado nunca se reintenta.
    """
    logger.info("Actualizando estado de estudio %s a COMPLETADO", event.estudio_id)
    try:
        async with shared_db.async_session_factory() as session:
            uow = SqlAlchemyUnitOfWork(session=session)
            repo = EstudioRepositoryImpl(uow)
            # `EstudioService` sólo requiere el repositorio: marcar_completado() no
            # toca storage ni valida el paciente. (Antes se le pasaba storage=... y
            # el constructor no acepta ese kwarg, así que el handler moría con
            # TypeError y el estudio nunca pasaba a COMPLETADO.)
            service = EstudioService(estudio_repo=repo)

            async with uow:
                await service.marcar_completado(event.estudio_id)
                await uow.commit()
    except Exception:
        logger.exception(
            "FATAL ERROR en handler on_analisis_completado_update_estudio para estudio %s",
            event.estudio_id,
        )
