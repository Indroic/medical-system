import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379/0";

// Usamos una única conexión Redis para suscribirse a eventos
const subscriber = new Redis(redisUrl);

type Callback = (data: any) => void;
const listeners = new Map<string, Set<Callback>>();

subscriber.subscribe("estudios_updates", (err) => {
  if (err) console.error("Error subscribing to redis:", err);
});

subscriber.on("message", (channel, message) => {
  if (channel === "estudios_updates") {
    try {
      const data = JSON.parse(message);
      const event = data.event;
      const estudioId = data.payload.estudio_id;
      
      const callbacks = listeners.get(estudioId);
      if (callbacks) {
        callbacks.forEach((cb) => cb(data));
      }
    } catch (e) {
      console.error("Error parsing redis message", e);
    }
  }
});

export const eventsRouter = new Hono();

eventsRouter.get("/:id", async (c) => {
  const estudioId = c.req.param("id");

  c.header("X-Accel-Buffering", "no");

  return streamSSE(c, async (stream) => {
    // Al conectar
    const callback = async (data: any) => {
      await stream.writeSSE({
        data: JSON.stringify(data),
        event: data.event,
      });
    };

    if (!listeners.has(estudioId)) {
      listeners.set(estudioId, new Set());
    }
    listeners.get(estudioId)!.add(callback);

    // Mantener la conexión viva hasta que el cliente desconecte
    c.req.raw.signal.addEventListener("abort", () => {
      const callbacks = listeners.get(estudioId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          listeners.delete(estudioId);
        }
      }
    });

    // Dummy loop para mantener el stream abierto (SSE keep-alive)
    while (!c.req.raw.signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, 15000));
      await stream.writeSSE({ event: "ping", data: "keep-alive" });
    }
  });
});
