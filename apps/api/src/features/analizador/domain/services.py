import logging
from uuid import UUID

from hexcore.domain.services import BaseDomainService

from .entities import AnalisisResonancia
from .exceptions import ImagenNoAccesibleException
from .ports import ILLMAdapter, IModeloInferenciaAdapter
from .repositories import IAnalisisRepository

logger = logging.getLogger(__name__)


class AnalizadorDomainService(BaseDomainService):
    def __init__(
        self,
        repo: IAnalisisRepository,
        ia_adapter: IModeloInferenciaAdapter,
        llm_adapter: ILLMAdapter,
    ) -> None:
        self._repo = repo
        self._ia_adapter = ia_adapter
        self._llm_adapter = llm_adapter
        super().__init__()

    async def iniciar_inferencia(self, estudio_id: UUID, imagenes_paths: list[str]) -> AnalisisResonancia:
        from src.shared.infrastructure.storage.s3_client import S3StorageAdapter
        
        # Validar primera imagen como mínimo
        if imagenes_paths and not await S3StorageAdapter().exists(imagenes_paths[0]):
            raise ImagenNoAccesibleException(imagenes_paths[0])

        analisis = await self._repo.get_by_estudio(estudio_id)
        if analisis:
            return analisis

        analisis = AnalisisResonancia(
            estudio_id=estudio_id,
            imagenes_paths=imagenes_paths,
        )
        analisis.marcar_procesando()
        await self._repo.save(analisis)
        return analisis

    async def ejecutar_inferencia(self, estudio_id: UUID, imagenes_paths: list[str]) -> AnalisisResonancia:
        # Método usado por Celery Worker
        analisis = await self._repo.get_by_estudio(estudio_id)
        if not analisis:
            analisis = AnalisisResonancia(estudio_id=estudio_id, imagenes_paths=imagenes_paths)
            analisis.marcar_procesando()

        try:
            todos_los_hallazgos = []
            for i, path in enumerate(imagenes_paths):
                hallazgos_slice = await self._ia_adapter.inferir(path, image_index=i)
                todos_los_hallazgos.extend(hallazgos_slice)

            # Generar reporte con el LLM
            reporte_ia = await self._llm_adapter.generar_reporte_clinico(todos_los_hallazgos)
            analisis.informe_avanzado_ia = reporte_ia

            analisis.registrar_resultados(todos_los_hallazgos)  # emite AnalisisCompletadoEvent
            logger.debug("Inferencia completada: %d hallazgos", len(todos_los_hallazgos))
        except Exception:
            # OJO: NO se puede persistir aquí. Este método corre dentro del
            # `async with uow:` del llamador (tasks.py); si la excepción se
            # propaga, esa transacción se revierte por completo (incluido
            # cualquier `save()` hecho antes del `raise`). Marcar el análisis
            # y el estudio como FALLIDO en una transacción nueva es
            # responsabilidad del llamador — ver el `except` de
            # `_procesar_estudio_ia_async` en tasks.py.
            analisis.marcar_fallido()
            raise

        await self._repo.save(analisis)
        return analisis
