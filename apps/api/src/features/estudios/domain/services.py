from typing import Protocol
from uuid import UUID

from hexcore.domain.services import BaseDomainService

from .entities import Estudio
from .exceptions import PacienteInexistenteException
from .repositories import IEstudioRepository


class IArchivoStorageAdapter(Protocol):
    """Puerto para desacoplar el storage físico (local / S3) del dominio."""

    async def guardar(self, nombre_archivo: str, contenido: bytes) -> str:
        """Persiste el archivo y retorna la URI/path definitivo."""
        ...


class IPacienteLookup(Protocol):
    """Puerto mínimo para comprobar que el paciente al que se vincula el estudio
    existe, sin acoplar este slice al repositorio del slice `pacientes`."""

    async def existe(self, paciente_id: UUID) -> bool: ...


class EstudioService(BaseDomainService):
    TIPOS_PERMITIDOS = {"image/dicom", "image/png", "image/jpeg", "application/dicom"}

    def __init__(
        self,
        estudio_repo: IEstudioRepository,
        paciente_lookup: IPacienteLookup | None = None,
    ) -> None:
        self._repo = estudio_repo
        # Opcional: los flujos que sólo cambian el estado de un estudio ya
        # existente (p.ej. el handler de AnalisisCompletadoEvent) no lo necesitan.
        self._paciente_lookup = paciente_lookup
        super().__init__()

    async def recepcionar_estudio(
        self,
        paciente_id: UUID,
        imagenes_paths: list[str],
        mime_type: str,
        medico_id: str,
    ) -> Estudio:
        if self._paciente_lookup is not None and not await self._paciente_lookup.existe(
            paciente_id
        ):
            raise PacienteInexistenteException(str(paciente_id))

        estudio = Estudio(
            paciente_id=paciente_id,
            imagenes_paths=imagenes_paths,
            mime_type=mime_type,
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
