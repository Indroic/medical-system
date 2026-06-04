from uuid import UUID

from hexcore.domain.events import DomainEvent


class EstudioRecibidoEvent(DomainEvent):
    entity_id: UUID
    paciente_nombre: str
    imagen_path: str
