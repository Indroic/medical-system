from uuid import UUID

from hexcore.domain.events import DomainEvent


class EstudioRecibidoEvent(DomainEvent):
    entity_id: UUID
    paciente_id: UUID
    imagen_path: str
