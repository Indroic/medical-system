import logging
from typing import Protocol
from uuid import UUID

from hexcore.domain.services import BaseDomainService

from .entities import Estudio
from .repositories import IEstudioRepository

logger = logging.getLogger(__name__)


class IArchivoStorageAdapter(Protocol):
    """Puerto para desacoplar el storage físico (local / S3) del dominio."""

    async def guardar(self, nombre_archivo: str, contenido: bytes) -> str:
        """Persiste el archivo y retorna la URI/path definitivo."""
        ...


class EstudioService(BaseDomainService):
    TIPOS_PERMITIDOS = {"image/dicom", "image/png", "image/jpeg", "application/dicom"}

    def __init__(
        self,
        estudio_repo: IEstudioRepository,
    ) -> None:
        self._repo = estudio_repo
        super().__init__()

    async def recepcionar_estudio(
        self,
        paciente_id: UUID,
        imagenes_paths: list[str],
        mime_type: str,
        medico_id: str,
    ) -> Estudio:
        logger.warning(
            "DEBUG recepcionar_estudio args paciente_id=%r (%s) medico_id=%r (%s)",
            paciente_id, type(paciente_id), medico_id, type(medico_id),
        )
        estudio = Estudio(
            paciente_id=paciente_id,
            imagenes_paths=imagenes_paths,
            mime_type=mime_type,
            medico_id=medico_id,
        )
        estudio.registrar_recepcion()
        logger.warning(
            "DEBUG estudio antes de save: paciente_id=%r (%s) medico_id=%r (%s) | model_dump=%r",
            estudio.paciente_id, type(estudio.paciente_id),
            estudio.medico_id, type(estudio.medico_id),
            estudio.model_dump(),
        )
        await self._repo.save(estudio)
        logger.warning(
            "DEBUG estudio despues de save: paciente_id=%r medico_id=%r",
            estudio.paciente_id, estudio.medico_id,
        )
        return estudio

    async def marcar_completado(self, estudio_id: UUID) -> Estudio:
        estudio = await self._repo.get_by_id(estudio_id)
        estudio.marcar_completado()
        await self._repo.save(estudio)
        return estudio
