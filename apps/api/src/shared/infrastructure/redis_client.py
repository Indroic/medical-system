import json
import logging
import os
import redis.asyncio as redis

logger = logging.getLogger(__name__)

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
_redis_pool = None

def get_redis() -> redis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.from_url(redis_url, decode_responses=True)
    return _redis_pool

async def publish_event(channel: str, event_name: str, payload: dict) -> None:
    try:
        r = get_redis()
        message = json.dumps({"event": event_name, "payload": payload})
        await r.publish(channel, message)
    except Exception as e:
        logger.error(f"Error publishing to redis: {e}")
