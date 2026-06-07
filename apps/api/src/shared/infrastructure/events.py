import asyncio
import typing as t
from collections import defaultdict

from hexcore.domain.events import DomainEvent, IEventDispatcher


class AsyncEventDispatcher(IEventDispatcher):
    def __init__(self) -> None:
        self._handlers: defaultdict[str, list[t.Callable[[DomainEvent], t.Awaitable[None]]]] = defaultdict(list)

    async def dispatch(self, event: DomainEvent) -> None:
        event_name = event.__class__.__name__
        print(f"Dispatching event {event_name}. Handlers: {self._handlers[event_name]}")
        for handler in self._handlers[event_name]:
            asyncio.create_task(handler(event))

    def subscribe(
        self,
        event_type: type[DomainEvent],
        handler: t.Callable[[DomainEvent], t.Awaitable[None]],
    ) -> None:
        name = event_type.__name__
        print(f"Subscribing {handler} to {name}")
        self._handlers[name].append(handler)
        
    def register(
        self,
        event_type: type[DomainEvent],
        handler: t.Callable[[DomainEvent], t.Awaitable[None]],
    ) -> None:
        self.subscribe(event_type, handler)
