import asyncio
import logging
from celery import shared_task
from uuid import UUID

from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork
import src.shared.infrastructure.database as shared_db
from src.features.analizador.domain.services import AnalizadorDomainService
from src.features.analizador.infrastructure.repositories import AnalisisRepositoryImpl
from src.features.analizador.infrastructure.adapters.yolo_adapter import YoloInferenciaAdapter
from src.config import config

logger = logging.getLogger(__name__)

async def _procesar_estudio_ia_async(estudio_id_str: str, imagen_path: str):
    estudio_id = UUID(estudio_id_str)
    async with shared_db.async_session_factory() as session:
        uow = SqlAlchemyUnitOfWork(session=session)
        repo = AnalisisRepositoryImpl(uow)
        adapter = YoloInferenciaAdapter(model_path=config.yolo_model_path)
        service = AnalizadorDomainService(repo=repo, ia_adapter=adapter)
        
        async with uow:
            analisis = await service.ejecutar_inferencia(estudio_id, imagen_path)
            await uow.commit()  # Esto dispara el AnalisisCompletadoEvent asíncronamente
            
        from src.shared.infrastructure.redis_client import publish_event
        await publish_event("estudios_updates", "ANALISIS_COMPLETADO", {
            "estudio_id": estudio_id_str
        })

@shared_task(name="procesar_estudio_ia")
def procesar_estudio_ia(estudio_id_str: str, imagen_path: str):
    logger.info("Iniciando tarea celery para estudio %s", estudio_id_str)
    asyncio.run(_procesar_estudio_ia_async(estudio_id_str, imagen_path))
    logger.info("Tarea celery finalizada para estudio %s", estudio_id_str)
