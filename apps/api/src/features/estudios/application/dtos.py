from uuid import UUID

from hexcore.application.dtos.base import DTO


class RecepcionarEstudioCommand(DTO):
    """Los bytes del archivo se pasan aparte en el use case (via UploadFile)."""
    paciente_nombre: str
    paciente_apellido: str
    paciente_fecha_nacimiento: str   # YYYY-MM-DD
    paciente_documento: str
    medico_id: str


class EstudioResponse(DTO):
    id: UUID
    paciente_nombre_completo: str
    imagen_path: str
    mime_type: str
    estado: str
    medico_id: str


class EstudioListResponse(DTO):
    items: list[EstudioResponse]
    total: int
