from pathlib import Path
from uuid import UUID

from hexcore.domain.services import BaseDomainService

from .entities import AnalisisTomografia
from .exceptions import ImagenNoAccesibleException
from .ports import IModeloInferenciaAdapter
from .repositories import IAnalisisRepository


class AnalizadorDomainService(BaseDomainService):
    def __init__(
        self,
        repo: IAnalisisRepository,
        ia_adapter: IModeloInferenciaAdapter,
    ) -> None:
        self._repo = repo
        self._ia_adapter = ia_adapter
        super().__init__()

    async def ejecutar_inferencia(
        self, estudio_id: UUID, imagen_path: str
    ) -> AnalisisTomografia:
        if not Path(imagen_path).exists():
            raise ImagenNoAccesibleException(imagen_path)

        analisis = AnalisisTomografia(
            estudio_id=estudio_id,
            imagen_path=imagen_path,
        )
        analisis.marcar_procesando()

        try:
            # Llamada al puerto de IA (implementado en infraestructura)
            hallazgos = await self._ia_adapter.inferir(imagen_path)
            analisis.registrar_resultados(hallazgos)  # emite AnalisisCompletadoEvent
            print(f"Events after registrar_resultados: {analisis._domain_events}")
        except Exception:
            analisis.marcar_fallido()
            raise

        print(f"Events before save: {analisis._domain_events}")
        await self._repo.save(analisis)
        print(f"Events after save: {analisis._domain_events}")
        return analisis
