from datetime import UTC, datetime
from typing import ClassVar
from uuid import UUID

from hexcore.domain.base import BaseEntity

from .exceptions import ReporteNoEditableException


class Reporte(BaseEntity):
    """Agrega el resultado exportable de un análisis.
    id, created_at, updated_at, is_active provistos por BaseEntity."""

    # Ciclo de vida:
    #   GENERANDO → el PDF se está construyendo
    #   LISTO     → PDF disponible, pendiente de validación médica (editable)
    #   FALLIDO   → falló la generación del PDF (editable, se puede complementar)
    #   APROBADO  → validado por un médico. Estado terminal: NO editable.
    #
    # "Pendiente" en la UI == cualquier estado distinto de APROBADO.
    # ClassVar es obligatorio: BaseEntity es un modelo Pydantic y un atributo de
    # clase sin anotación se interpretaría como campo mal declarado.
    ESTADOS_EDITABLES: ClassVar[frozenset[str]] = frozenset(
        {"GENERANDO", "LISTO", "FALLIDO"}
    )
    ESTADO_APROBADO: ClassVar[str] = "APROBADO"

    estudio_id: UUID
    analisis_id: UUID
    nivel_riesgo: str
    total_hallazgos: int
    pdf_path: str | None = None
    estado: str = "GENERANDO"   # GENERANDO | LISTO | FALLIDO | APROBADO

    # Información clínica que el médico complementa antes de aprobar.
    observaciones: str | None = None
    # Trazabilidad de la aprobación (CUID de Better-Auth del médico).
    aprobado_por: str | None = None
    aprobado_en: datetime | None = None

    def marcar_listo(self, pdf_path: str) -> None:
        self.pdf_path = pdf_path
        self.estado = "LISTO"

    def marcar_fallido(self) -> None:
        self.estado = "FALLIDO"

    # ── Edición mientras el reporte está pendiente ──────────────────────────

    def esta_editable(self) -> bool:
        """Un reporte aprobado queda congelado para preservar la trazabilidad."""
        return self.estado in self.ESTADOS_EDITABLES

    def editar(
        self,
        observaciones: str | None = None,
        nivel_riesgo: str | None = None,
    ) -> None:
        """Complementa o corrige el reporte. Sólo válido si está pendiente.

        Los campos en None se dejan intactos: es un PATCH, no un reemplazo.
        """
        if not self.esta_editable():
            raise ReporteNoEditableException(self.estado)

        if observaciones is not None:
            self.observaciones = observaciones
        if nivel_riesgo is not None:
            self.nivel_riesgo = nivel_riesgo

    def aprobar(self, medico_id: str) -> None:
        """Cierra el reporte. A partir de aquí `editar()` falla."""
        if not self.esta_editable():
            raise ReporteNoEditableException(self.estado)

        self.estado = self.ESTADO_APROBADO
        self.aprobado_por = medico_id
        self.aprobado_en = datetime.now(UTC)
