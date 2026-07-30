import { Hono } from "hono";
import { env } from "@medical-system/env/server";
import { getAuthToken } from "../utils";

export const estudios = new Hono()
  .get("/", async (c) => {
    const token = await getAuthToken(c);
    // Pasar cualquier query parameter hacia Python
    const url = new URL(`${env.PYTHON_API_URL}/api/v1/estudios/`);
    Object.entries(c.req.query()).forEach(([key, val]) => url.searchParams.append(key, val));
    
    const res = await fetch(url.toString(), {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Python API Error] GET /estudios: ${res.status} - ${errorText}`);
      return c.json({ error: "Failed to fetch from API", detail: errorText }, res.status as any);
    }
    
    const data = await res.json();
    return c.json(data);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const token = await getAuthToken(c);
    
    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/estudios/${id}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    
    if (!res.ok) {
      return c.json({ error: "Failed to fetch from API" }, res.status as any);
    }
    
    const data = await res.json();
    return c.json(data);
  })
  .post("/imagenes", async (c) => {
    const token = await getAuthToken(c);
    const formData = await c.req.formData();

    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/estudios/imagenes`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return c.json({ error: "Failed to fetch from API", detail: errorText }, res.status as any);
    }

    const data = await res.json();
    return c.json(data);
  })
  .post("/", async (c) => {
    const token = await getAuthToken(c);
    const body = await c.req.json();

    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/estudios/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Python API Error] POST /estudios: ${res.status} - ${errorText}`);
      // Reenviar el `detail` de FastAPI tal cual para que el cliente pueda
      // mostrarlo (p.ej. "El paciente <id> no existe." en un 404).
      let detail = errorText;
      try {
        detail = JSON.parse(errorText).detail ?? errorText;
      } catch {}
      return c.json({ error: "Failed to create resource", detail }, res.status as any);
    }

    const data = await res.json();
    return c.json(data);
  });
