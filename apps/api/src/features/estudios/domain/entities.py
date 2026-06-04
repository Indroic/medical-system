from hexcore.domain.base import BaseEntity

from .events import EstudioRecibidoEvent
from uuid import UUID


class Estudio(BaseEntity):
    """Agrega la tomografía/imagen con su metadato de paciente.
    id, created_at, updated_at, is_active provistos por BaseEntity."""

    paciente_id: UUID
    imagen_path: str          # Ruta local o URI S3 del archivo almacenado
    mime_type: str
    medico_id: str            # UUID del médico que sube el estudio (FK lógica)
    estado: str = "PENDIENTE" # PENDIENTE | EN_ANALISIS | COMPLETADO

    def registrar_recepcion(self) -> None:
        """Emite el evento de dominio tras la persistencia exitosa."""
        self.register_event(
            EstudioRecibidoEvent(
                entity_id=self.id,
                paciente_id=self.paciente_id,
                imagen_path=self.imagen_path,
            )
        )

    def marcar_en_analisis(self) -> None:
        self.estado = "EN_ANALISIS"

    def marcar_completado(self) -> None:
        self.estado = "COMPLETADO"
