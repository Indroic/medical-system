from uuid import UUID

from hexcore.domain.events import DomainEvent


class AnalisisCompletadoEvent(DomainEvent):
    """Publicado cuando el analizador termina de procesar una tomografía.
    El slice `reportes` suscribe un handler a este evento."""
    entity_id: UUID
    estudio_id: UUID
    nivel_riesgo: str
    total_hallazgos: int
    informe_avanzado_ia: str | None = None
