from uuid import UUID

from hexcore.application.dtos.base import DTO


class RecepcionarEstudioCommand(DTO):
    paciente_id: UUID
    imagenes_paths: list[str]
    mime_type: str
    medico_id: str


class RecepcionarEstudioRequest(DTO):
    """Body JSON del endpoint de creación de estudio. Las imágenes ya deben
    haber sido subidas previamente vía POST /estudios/imagenes."""
    paciente_id: UUID
    imagenes_paths: list[str]
    mime_type: str


class SubirImagenResponse(DTO):
    path: str
    mime_type: str


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
