from typing import Protocol

from hexcore.domain.services import BaseDomainService

from .entities import Estudio
from .exceptions import TipoArchivoNoPermitidoException
from .repositories import IEstudioRepository
from uuid import UUID


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
        storage: IArchivoStorageAdapter,
    ) -> None:
        self._repo = estudio_repo
        self._storage = storage
        super().__init__()

    async def recepcionar_estudio(
        self,
        paciente_id: UUID,
        nombre_archivo: str,
        contenido: bytes,
        mime_type: str,
        medico_id: str,
    ) -> Estudio:
        if mime_type not in self.TIPOS_PERMITIDOS:
            raise TipoArchivoNoPermitidoException(mime_type)

        imagen_path = await self._storage.guardar(nombre_archivo, contenido)

        estudio = Estudio(
            paciente_id=paciente_id,
            imagen_path=imagen_path,
            mime_type=mime_type,
            medico_id=medico_id,
        )
        estudio.registrar_recepcion()
        await self._repo.save(estudio)
        return estudio
