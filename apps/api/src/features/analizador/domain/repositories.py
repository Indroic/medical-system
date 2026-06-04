from typing import Protocol
from uuid import UUID

from .entities import AnalisisTomografia


class IAnalisisRepository(Protocol):
    async def get_by_id(self, entity_id: UUID) -> AnalisisTomografia: ...
    async def get_by_estudio(self, estudio_id: UUID) -> AnalisisTomografia | None: ...
    async def save(self, entity: AnalisisTomografia) -> None: ...
