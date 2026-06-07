from typing import Protocol
from uuid import UUID

from hexcore.domain.services import BaseDomainService

from .entities import Estudio
from .exceptions import TipoArchivoNoPermitidoException
from .repositories import IEstudioRepository


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
        archivos: list[dict], # [{"nombre_archivo": str, "contenido": bytes, "mime_type": str}]
        medico_id: UUID,
    ) -> Estudio:
        imagenes_paths = []
        mime_types_usados = []
        for archivo in archivos:
            if archivo["mime_type"] not in self.TIPOS_PERMITIDOS:
                raise TipoArchivoNoPermitidoException(archivo["mime_type"])
            
            imagen_path = await self._storage.guardar(archivo["nombre_archivo"], archivo["contenido"])
            imagenes_paths.append(imagen_path)
            mime_types_usados.append(archivo["mime_type"])

        estudio = Estudio(
            paciente_id=paciente_id,
            imagenes_paths=imagenes_paths,
            mime_type=mime_types_usados[0] if mime_types_usados else "application/octet-stream",
            medico_id=medico_id,
        )
        estudio.registrar_recepcion()
        await self._repo.save(estudio)
        return estudio

    async def marcar_completado(self, estudio_id: UUID) -> Estudio:
        estudio = await self._repo.get_by_id(estudio_id)
        estudio.marcar_completado()
        await self._repo.save(estudio)
        return estudio
