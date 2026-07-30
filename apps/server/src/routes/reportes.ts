import { Hono } from "hono";
import { env } from "@medical-system/env/server";
import { getAuthToken } from "../utils";

export const reportes = new Hono()
  .get("/", async (c) => {
    const token = await getAuthToken(c);
    const url = new URL(`${env.PYTHON_API_URL}/api/v1/reportes/`);
    Object.entries(c.req.query()).forEach(([key, val]) => url.searchParams.append(key, val));

    const res = await fetch(url.toString(), {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Python API Error] GET /reportes: ${res.status} - ${errorText}`);
      return c.json({ error: "Failed to fetch from API", detail: errorText }, res.status as any);
    }

    const data = await res.json();
    return c.json(data);
  })
  .get("/:estudio_id", async (c) => {
    const estudio_id = c.req.param("estudio_id");
    const token = await getAuthToken(c);
    
    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/reportes/${estudio_id}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Python API Error] GET /reportes/${estudio_id}: ${res.status} - ${errorText}`);
      return c.json({ error: "Failed to fetch from API", detail: errorText }, res.status as any);
    }
    
    const data = await res.json();
    return c.json(data);
  })
  .patch("/:estudio_id", async (c) => {
    const estudio_id = c.req.param("estudio_id");
    const token = await getAuthToken(c);
    const body = await c.req.json();

    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/reportes/${estudio_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Python API Error] PATCH /reportes/${estudio_id}: ${res.status} - ${errorText}`);
      // Un 409 aquí significa "reporte ya aprobado": el detail debe llegar
      // legible al cliente para poder mostrarlo tal cual.
      let detail = errorText;
      try {
        detail = JSON.parse(errorText).detail ?? errorText;
      } catch {}
      return c.json({ error: "Failed to update resource", detail }, res.status as any);
    }

    const data = await res.json();
    return c.json(data);
  })
  .post("/:estudio_id/aprobar", async (c) => {
    const estudio_id = c.req.param("estudio_id");
    const token = await getAuthToken(c);

    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/reportes/${estudio_id}/aprobar`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Python API Error] POST /reportes/${estudio_id}/aprobar: ${res.status} - ${errorText}`);
      let detail = errorText;
      try {
        detail = JSON.parse(errorText).detail ?? errorText;
      } catch {}
      return c.json({ error: "Failed to approve resource", detail }, res.status as any);
    }

    const data = await res.json();
    return c.json(data);
  })
  .get("/:estudio_id/descargar", async (c) => {
    const estudio_id = c.req.param("estudio_id");
    const token = await getAuthToken(c);
    
    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/reportes/${estudio_id}/descargar`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Python API Error] GET /reportes/${estudio_id}/descargar: ${res.status} - ${errorText}`);
      return c.json({ error: "Failed to download PDF", detail: errorText }, res.status as any);
    }
    
    return res;
  });
