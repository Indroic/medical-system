from uuid import UUID

from hexcore.domain.base import BaseEntity

from .events import AnalisisCompletadoEvent
from .value_objects import Hallazgo


class AnalisisResonancia(BaseEntity):
    """Raiz de agregado del proceso de inferencia.
    id, created_at, updated_at, is_active provistos por BaseEntity."""

    estudio_id: UUID
    imagenes_paths: list[str]
    estado: str = "PENDIENTE"          # PENDIENTE | PROCESANDO | COMPLETADO | FALLIDO
    hallazgos: list[Hallazgo] = None   # type: ignore[assignment]
    nivel_riesgo: str = "NO_EVALUADO"
    informe_avanzado_ia: str | None = None

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        if self.hallazgos is None:
            self.hallazgos = []

    # ── Comportamiento de dominio (Rich Model) ──────────────────────────────

    def marcar_procesando(self) -> None:
        self.estado = "PROCESANDO"

    def registrar_resultados(self, hallazgos: list[Hallazgo]) -> None:
        """Persiste los hallazgos y dispara la evaluación de riesgo."""
        self.hallazgos = hallazgos
        self.estado = "COMPLETADO"
        self._evaluar_severidad_riesgo()
        self._emitir_evento()

    def marcar_fallido(self) -> None:
        self.estado = "FALLIDO"
        self.nivel_riesgo = "NO_EVALUADO"

    def _evaluar_severidad_riesgo(self) -> None:
        """Regla de negocio pura: sin dependencias de infraestructura."""
        if not self.hallazgos:
            self.nivel_riesgo = "BAJO"
            return

        tiene_critico = any(h.es_critico() for h in self.hallazgos)
        max_confianza = max(h.confianza for h in self.hallazgos)

        if tiene_critico and max_confianza > 0.85:
            self.nivel_riesgo = "CRITICO"
        elif tiene_critico or len(self.hallazgos) >= 3 or max_confianza > 0.70:
            self.nivel_riesgo = "MODERADO"
        else:
            self.nivel_riesgo = "BAJO"

    def _emitir_evento(self) -> None:
        self.register_event(
            AnalisisCompletadoEvent(
                entity_id=self.id,
                estudio_id=self.estudio_id,
                nivel_riesgo=self.nivel_riesgo,
                total_hallazgos=len(self.hallazgos),
            )
        )
