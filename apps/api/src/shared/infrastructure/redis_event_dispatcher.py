import asyncio
import logging
from typing import Any, Awaitable, Callable

import redis.asyncio as redis
from hexcore.domain.events import DomainEvent, EventHandler, IEventDispatcher
from src.shared.infrastructure.redis_client import get_redis

logger = logging.getLogger(__name__)

STREAM_NAME = "hexcore:events"
GROUP_NAME = "hexcore_consumer_group"

class RedisStreamEventDispatcher(IEventDispatcher):
    def __init__(self) -> None:
        self._handlers: dict[str, list[EventHandler]] = {}
        self._event_classes: dict[str, type] = {}

    def register(self, event_type: type, handler: EventHandler) -> None:
        event_name = event_type.__name__
        if event_name not in self._handlers:
            self._handlers[event_name] = []
            self._event_classes[event_name] = event_type
        self._handlers[event_name].append(handler)
        logger.info(f"Registered handler {handler.__name__} for event {event_name}")

    async def dispatch(self, event: Any) -> None:
        if not isinstance(event, DomainEvent):
            logger.warning(f"Event {event} is not a DomainEvent, cannot dispatch to Redis.")
            return

        event_name = event.__class__.__name__
        payload = event.model_dump_json()
        
        r = get_redis()
        try:
            # XADD to stream
            await r.xadd(STREAM_NAME, {"event_name": event_name, "payload": payload})
            logger.debug(f"Dispatched {event_name} to Redis Stream {STREAM_NAME}")
        except Exception as e:
            logger.error(f"Error dispatching {event_name} to Redis: {e}")

    async def _setup_group(self, r: redis.Redis) -> None:
        try:
            # Create group if it doesn't exist. "0" means start consuming from the beginning of the stream.
            await r.xgroup_create(STREAM_NAME, GROUP_NAME, mkstream=True, id="0")
            logger.info(f"Created consumer group {GROUP_NAME} for stream {STREAM_NAME}")
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

    async def consumer_loop(self) -> None:
        r = get_redis()
        await self._setup_group(r)
        
        # We can hardcode consumer name or use UUID. Using a static one for now.
        consumer_name = "fastapi_consumer_1"
        logger.info(f"Starting consumer loop for group {GROUP_NAME} on stream {STREAM_NAME}")
        
        while True:
            try:
                # Read messages
                response = await r.xreadgroup(
                    GROUP_NAME, 
                    consumer_name, 
                    {STREAM_NAME: ">"}, 
                    count=10, 
                    block=2000
                )
                
                if not response:
                    continue
                
                for stream, messages in response:
                    for message_id, message_data in messages:
                        event_name = message_data.get("event_name")
                        payload_json = message_data.get("payload")
                        
                        if event_name in self._handlers:
                            event_cls = self._event_classes[event_name]
                            try:
                                # Reconstruct the event object
                                event_obj = event_cls.model_validate_json(payload_json)
                                # Execute all registered handlers sequentially
                                for handler in self._handlers[event_name]:
                                    await handler(event_obj)
                            except Exception as e:
                                logger.error(f"Error processing handler for {event_name}: {e}")
                                
                        # Always Acknowledge the message so it's not re-processed
                        await r.xack(STREAM_NAME, GROUP_NAME, message_id)
                        
            except asyncio.CancelledError:
                logger.info("Consumer loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in consumer loop: {e}")
                await asyncio.sleep(1)
