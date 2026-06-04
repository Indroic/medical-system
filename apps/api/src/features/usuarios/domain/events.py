from uuid import UUID

from hexcore.domain.events import DomainEvent


class UserRegistradoEvent(DomainEvent):
    entity_id: UUID
    email: str
