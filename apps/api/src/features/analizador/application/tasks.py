import asyncio
import logging
from uuid import UUID

# ruff: noqa: E402, I001
import config  # Monkey-patch debe ejecutarse antes que hexcore
from config import config as app_config

from celery import shared_task
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork
from src.features.analizador.domain.services import AnalizadorDomainService
from src.features.analizador.infrastructure.adapters.gemini_adapter import GeminiAdapter
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

async def _marcar_estudio(estudio_id: UUID, *, fallido: bool) -> None:
    """Actualiza el estado del `Estudio` en una transacción propia e
    independiente de la del análisis.

    Se llama directo desde la tarea de Celery en vez de depender solo del
    `AnalisisCompletadoEvent` (que se procesa en el consumer_loop del proceso
    de FastAPI, aparte): si ese pipeline no corre o su handler falla, el
    estudio se queda en EN_ANALISIS para siempre porque Redis Streams no
    reintenta un mensaje ya entregado y no confirmado. Esta llamada directa es
    la fuente de verdad; el evento sigue disparándose para sus otros efectos
    (generar el reporte, notificar por SSE).
    """
    from src.features.estudios.domain.services import EstudioService
    from src.features.estudios.infrastructure.repositories import EstudioRepositoryImpl

    async with celery_session_factory() as session:
        uow = SqlAlchemyUnitOfWork(session=session)
        repo = EstudioRepositoryImpl(uow)
        service = EstudioService(estudio_repo=repo)
        async with uow:
            if fallido:
                await service.marcar_fallido(estudio_id)
            else:
                await service.marcar_completado(estudio_id)
            await uow.commit()


async def _procesar_estudio_ia_async(estudio_id_str: str, imagenes_paths: list[str]):
    estudio_id = UUID(estudio_id_str)
    async with celery_session_factory() as session:
        uow = SqlAlchemyUnitOfWork(session=session)
        repo = AnalisisRepositoryImpl(uow)
        adapter = YoloInferenciaAdapter(model_path=app_config.yolo_model_path)
        llm_adapter = GeminiAdapter(
            api_key=app_config.gemini_api_key,
            model_name=app_config.gemini_model_name,
            prompt_template=app_config.gemini_prompt_template
        )
        service = AnalizadorDomainService(repo=repo, ia_adapter=adapter, llm_adapter=llm_adapter)

        try:
            async with uow:
                analisis = await service.ejecutar_inferencia(estudio_id, imagenes_paths)
                await uow.commit()  # Esto dispara el AnalisisCompletadoEvent asíncronamente
        except Exception:
            logger.exception("Fallo al procesar el análisis del estudio %s", estudio_id_str)
            try:
                await _marcar_estudio(estudio_id, fallido=True)
            except Exception:
                logger.exception(
                    "Además falló al marcar el estudio %s como FALLIDO", estudio_id_str
                )
            raise

        await _marcar_estudio(estudio_id, fallido=False)

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
