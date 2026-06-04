from uuid import UUID

from hexcore.application.dtos.base import DTO


class EjecutarInferenciaCommand(DTO):
    estudio_id: UUID
    imagen_path: str


class HallazgoDTO(DTO):
    etiqueta: str
    confianza: float
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    es_critico: bool


class AnalisisResponse(DTO):
    analisis_id: UUID
    estudio_id: UUID
    estado: str
    nivel_riesgo: str
    hallazgos: list[HallazgoDTO]
    total_hallazgos: int
