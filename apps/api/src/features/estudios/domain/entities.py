from hexcore.domain.base import BaseEntity

from .events import EstudioRecibidoEvent
from .value_objects import Paciente


class Estudio(BaseEntity):
    """Agrega la tomografía/imagen con su metadato de paciente.
    id, created_at, updated_at, is_active provistos por BaseEntity."""

    paciente: Paciente
    imagen_path: str          # Ruta local o URI S3 del archivo almacenado
    mime_type: str
    medico_id: str            # UUID del médico que sube el estudio (FK lógica)
    estado: str = "PENDIENTE" # PENDIENTE | EN_ANALISIS | COMPLETADO

    def registrar_recepcion(self) -> None:
        """Emite el evento de dominio tras la persistencia exitosa."""
        self.register_event(
            EstudioRecibidoEvent(
                entity_id=self.id,
                paciente_nombre=self.paciente.nombre_completo,
                imagen_path=self.imagen_path,
            )
        )

    def marcar_en_analisis(self) -> None:
        self.estado = "EN_ANALISIS"

    def marcar_completado(self) -> None:
        self.estado = "COMPLETADO"
