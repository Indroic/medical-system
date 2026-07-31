from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ActualizarReporteCommand(BaseModel):
    """PATCH del reporte: los campos omitidos no se tocan."""

    observaciones: str | None = Field(
        None,
        max_length=8000,
        description="Notas clínicas complementarias del médico.",
    )
    nivel_riesgo: str | None = Field(
        None,
        description="Corrección manual del riesgo evaluado automáticamente.",
        pattern="^(BAJO|MODERADO|CRITICO|NO_EVALUADO)$",
    )


class ReporteResponse(BaseModel):
    reporte_id: UUID
    estudio_id: UUID
    estado: str
    nivel_riesgo: str
    total_hallazgos: int
    pdf_disponible: bool
    observaciones: str | None = None
    # `editable` lo calcula el dominio (Reporte.esta_editable) para que la UI no
    # tenga que replicar la regla de qué estados admiten cambios.
    editable: bool
    aprobado_por: str | None = None
    aprobado_en: datetime | None = None


class ReporteListResponse(BaseModel):
    items: list[ReporteResponse]
    total: int
