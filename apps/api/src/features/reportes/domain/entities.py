from uuid import UUID

from hexcore.domain.base import BaseEntity


class Reporte(BaseEntity):
    """Agrega el resultado exportable de un análisis.
    id, created_at, updated_at, is_active provistos por BaseEntity."""

    estudio_id: UUID
    analisis_id: UUID
    nivel_riesgo: str
    total_hallazgos: int
    pdf_path: str | None = None
    estado: str = "GENERANDO"   # GENERANDO | LISTO | FALLIDO

    def marcar_listo(self, pdf_path: str) -> None:
        self.pdf_path = pdf_path
        self.estado = "LISTO"

    def marcar_fallido(self) -> None:
        self.estado = "FALLIDO"
