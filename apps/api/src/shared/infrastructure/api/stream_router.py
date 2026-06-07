import asyncio
import json
import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from src.shared.infrastructure.redis_client import get_redis

router = APIRouter(tags=["Events", "SSE"])
logger = logging.getLogger(__name__)

STREAM_NAME = "hexcore:events"

async def event_generator(request: Request, estudio_id: str):
    r = get_redis()
    # Para obtener solo mensajes nuevos desde que el cliente se conecta
    last_id = "$"
    
    try:
        while True:
            if await request.is_disconnected():
                logger.info(f"Client disconnected from SSE stream for estudio {estudio_id}")
                break
                
            # xread block es una llamada bloqueante. block=2000 ms.
            response = await r.xread({STREAM_NAME: last_id}, count=10, block=2000)
            
            if not response:
                # Enviar un comentario (heartbeat) para mantener la conexión viva
                yield ": heartbeat\n\n"
                continue
                
            for stream, messages in response:
                for message_id, message_data in messages:
                    last_id = message_id
                    
                    event_name = message_data.get("event_name", "")
                    payload_json = message_data.get("payload", "{}")
                    
                    try:
                        payload = json.loads(payload_json)
                        # Filtrar eventos que pertenezcan a este estudio
                        if payload.get("estudio_id") == estudio_id:
                            event_type = "MESSAGE"
                            
                            if event_name == "AnalisisCompletadoEvent":
                                event_type = "ANALISIS_COMPLETADO"
                                
                            # Si en el futuro hay ReporteGeneradoEvent, se añade aquí:
                            # elif event_name == "ReporteGeneradoEvent":
                            #     event_type = "REPORTE_LISTO"
                                
                            logger.info(f"Sending SSE {event_type} for estudio {estudio_id}")
                            yield f"event: {event_type}\ndata: {payload_json}\n\n"
                    except Exception as e:
                        logger.error(f"Error parsing event payload in SSE: {e}")
                        
    except asyncio.CancelledError:
        logger.info(f"SSE stream cancelled for estudio {estudio_id}")
        
@router.get("/events/{estudio_id}")
async def stream_events(request: Request, estudio_id: str):
    """
    Endpoint de Server-Sent Events (SSE).
    Se suscribe al Redis Stream y notifica al cliente web en tiempo real
    cuando hay actualizaciones (ej. AnalisisCompletado) sobre un estudio.
    """
    return StreamingResponse(
        event_generator(request, estudio_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", # Critical for Nginx
        }
    )
