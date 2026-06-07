from uuid import UUID

from hexcore.application.dtos.base import DTO


class RecepcionarEstudioCommand(DTO):
    """Los bytes del archivo se pasan aparte en el use case (via UploadFile)."""
    paciente_id: UUID
    medico_id: str


class EstudioResponse(DTO):
    id: UUID
    paciente_id: UUID
    imagenes_paths: list[str]
    mime_type: str
    estado: str
    medico_id: str


class EstudioListResponse(DTO):
    items: list[EstudioResponse]
    total: int
