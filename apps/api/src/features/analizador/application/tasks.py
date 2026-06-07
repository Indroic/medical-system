import asyncio
import logging
from uuid import UUID

# ruff: noqa: E402, I001
import config  # Monkey-patch debe ejecutarse antes que hexcore
from config import config as app_config

from celery import shared_task
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork
from src.features.analizador.domain.services import AnalizadorDomainService
from src.features.analizador.infrastructure.adapters.llm_adapter import OllamaAdapter
from src.features.analizador.infrastructure.adapters.yolo_adapter import YoloInferenciaAdapter
from src.features.analizador.infrastructure.repositories import AnalisisRepositoryImpl

logger = logging.getLogger(__name__)

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

celery_engine = create_async_engine(
    app_config.async_sql_database_url,
    echo=app_config.debug,
    future=True,
    poolclass=NullPool
)

celery_session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    celery_engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

async def _procesar_estudio_ia_async(estudio_id_str: str, imagenes_paths: list[str]):
    estudio_id = UUID(estudio_id_str)
    async with celery_session_factory() as session:
        uow = SqlAlchemyUnitOfWork(session=session)
        repo = AnalisisRepositoryImpl(uow)
        adapter = YoloInferenciaAdapter(model_path=app_config.yolo_model_path)
        llm_adapter = OllamaAdapter(
            ollama_url=app_config.ollama_url, 
            model_name=app_config.ollama_model_name,
            prompt_template=app_config.ollama_prompt_template
        )
        service = AnalizadorDomainService(repo=repo, ia_adapter=adapter, llm_adapter=llm_adapter)
        
        async with uow:
            analisis = await service.ejecutar_inferencia(estudio_id, imagenes_paths)
            await uow.commit()  # Esto dispara el AnalisisCompletadoEvent asíncronamente
            
        from src.shared.infrastructure.redis_client import close_redis, publish_event
        try:
            await publish_event("estudios_updates", "ANALISIS_COMPLETADO", {
                "estudio_id": estudio_id_str
            })
        finally:
            await close_redis()

@shared_task(name="procesar_estudio_ia")
def procesar_estudio_ia(estudio_id_str: str, imagenes_paths: list[str]):
    logger.info("Iniciando tarea celery para estudio %s", estudio_id_str)
    asyncio.run(_procesar_estudio_ia_async(estudio_id_str, imagenes_paths))
    logger.info("Tarea celery finalizada para estudio %s", estudio_id_str)
