from uuid import UUID

from hexcore.domain.base import BaseEntity

from .events import EstudioRecibidoEvent


class Estudio(BaseEntity):
    """Agrega la tomografía/imagen con su metadato de paciente.
    id, created_at, updated_at, is_active provistos por BaseEntity."""

    paciente_id: UUID
    imagenes_paths: list[str]          # Rutas locales o URIs S3 de los archivos almacenados
    mime_type: str
    medico_id: UUID            # UUID del médico que sube el estudio (FK lógica)
    estado: str = "PENDIENTE" # PENDIENTE | EN_ANALISIS | COMPLETADO

    def registrar_recepcion(self) -> None:
        """Emite el evento de dominio tras la persistencia exitosa."""
        self.register_event(
            EstudioRecibidoEvent(
                entity_id=self.id,
                paciente_id=self.paciente_id,
                imagenes_paths=self.imagenes_paths,
            )
        )

    def marcar_en_analisis(self) -> None:
        self.estado = "EN_ANALISIS"

    def marcar_completado(self) -> None:
        self.estado = "COMPLETADO"
