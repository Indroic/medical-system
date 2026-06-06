import { Hono } from "hono";
import { env } from "@medical-system/env/server";
import { getAuthToken } from "../utils";

export const reportes = new Hono()
  .get("/:estudio_id", async (c) => {
    const estudio_id = c.req.param("estudio_id");
    const token = getAuthToken(c);
    
    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/reportes/${estudio_id}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    
    if (!res.ok) {
      return c.json({ error: "Failed to fetch from API" }, res.status as any);
    }
    
    const data = await res.json();
    return c.json(data);
  })
  .get("/:estudio_id/descargar", async (c) => {
    const estudio_id = c.req.param("estudio_id");
    const token = getAuthToken(c);
    
    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/reportes/${estudio_id}/descargar`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    
    return res;
  });
