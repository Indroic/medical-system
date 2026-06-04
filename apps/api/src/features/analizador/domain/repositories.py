from typing import Protocol
from uuid import UUID

from .entities import AnalisisResonancia


class IAnalisisRepository(Protocol):
    async def get_by_id(self, entity_id: UUID) -> AnalisisResonancia: ...
    async def get_by_estudio(self, estudio_id: UUID) -> AnalisisResonancia | None: ...
    async def save(self, entity: AnalisisResonancia) -> None: ...
