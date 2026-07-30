from uuid import UUID

from hexcore.application.dtos.base import DTO


class EjecutarInferenciaCommand(DTO):
    estudio_id: UUID
    imagenes_paths: list[str]


class HallazgoDTO(DTO):
    etiqueta: str
    confianza: float
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    es_critico: bool
    image_index: int
    # Tamaño de la imagen original sobre la que se calcularon x_min/y_min/...
    # El visor lo necesita porque muestra una versión redimensionada.
    # 0 = desconocido (análisis anteriores a este campo).
    img_width: int = 0
    img_height: int = 0


class AnalisisResponse(DTO):
    analisis_id: UUID
    estudio_id: UUID
    estado: str
    nivel_riesgo: str
    hallazgos: list[HallazgoDTO]
    total_hallazgos: int
    informe_avanzado_ia: str | None = None
