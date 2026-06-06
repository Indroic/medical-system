import logging
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

import src.shared.infrastructure.database as shared_db
from src.features.analizador.domain.events import AnalisisCompletadoEvent
from src.features.estudios.infrastructure.repositories import EstudioRepositoryImpl
from src.features.estudios.domain.services import EstudioService
from src.shared.infrastructure.storage.s3_client import S3StorageAdapter

logger = logging.getLogger(__name__)

async def on_analisis_completado_update_estudio(event: AnalisisCompletadoEvent) -> None:
    """
    Actualiza el estado del estudio a COMPLETADO cuando el analizador
    finaliza el proceso de inferencia de IA.
    """
    logger.info("Actualizando estado de estudio %s a COMPLETADO", event.estudio_id)
    async with shared_db.async_session_factory() as session:
        uow = SqlAlchemyUnitOfWork(session=session)
        repo = EstudioRepositoryImpl(uow)
        storage = S3StorageAdapter() # Requerido por EstudioService aunque no se use aqui
        service = EstudioService(estudio_repo=repo, storage=storage)
        
        async with uow:
            await service.marcar_completado(event.estudio_id)
            await uow.commit()
