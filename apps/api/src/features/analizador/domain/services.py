import logging
from pathlib import Path
from uuid import UUID

from hexcore.domain.services import BaseDomainService

from .entities import AnalisisResonancia
from .exceptions import ImagenNoAccesibleException
from .ports import IModeloInferenciaAdapter
from .repositories import IAnalisisRepository

logger = logging.getLogger(__name__)


class AnalizadorDomainService(BaseDomainService):
    def __init__(
        self,
        repo: IAnalisisRepository,
        ia_adapter: IModeloInferenciaAdapter,
    ) -> None:
        self._repo = repo
        self._ia_adapter = ia_adapter
        super().__init__()

    async def iniciar_inferencia(self, estudio_id: UUID, imagen_path: str) -> AnalisisResonancia:
        from src.shared.infrastructure.storage.s3_client import S3StorageAdapter
        if not await S3StorageAdapter().exists(imagen_path):
            raise ImagenNoAccesibleException(imagen_path)

        analisis = await self._repo.get_by_estudio(estudio_id)
        if analisis:
            return analisis

        analisis = AnalisisResonancia(
            estudio_id=estudio_id,
            imagen_path=imagen_path,
        )
        analisis.marcar_procesando()
        await self._repo.save(analisis)
        return analisis

    async def ejecutar_inferencia(self, estudio_id: UUID, imagen_path: str) -> AnalisisResonancia:
        # Método usado por Celery Worker
        analisis = await self._repo.get_by_estudio(estudio_id)
        if not analisis:
            analisis = AnalisisResonancia(estudio_id=estudio_id, imagen_path=imagen_path)
            analisis.marcar_procesando()

        try:
            hallazgos = await self._ia_adapter.inferir(imagen_path)
            analisis.registrar_resultados(hallazgos)  # emite AnalisisCompletadoEvent
            logger.debug("Inferencia completada: %d hallazgos", len(hallazgos))
        except Exception:
            analisis.marcar_fallido()
            raise

        await self._repo.save(analisis)
        return analisis
