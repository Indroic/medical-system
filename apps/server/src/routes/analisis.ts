import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { env } from "@medical-system/env/server";
import { getAuthToken } from "../utils";

export const analisis = new Hono()
  .get("/:estudio_id", async (c) => {
    const estudio_id = c.req.param("estudio_id");
      const token = await getAuthToken(c);
    
    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/analisis/${estudio_id}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    
    if (!res.ok) {
      return c.json({ error: "Failed to fetch from API" }, res.status as any);
    }
    
    const data = await res.json();
    return c.json(data);
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        estudio_id: z.string(),
        imagenes_paths: z.array(z.string()),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
        const token = await getAuthToken(c);
      
      const res = await fetch(`${env.PYTHON_API_URL}/api/v1/analisis/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        return c.json({ error: "Failed to execute analysis" }, res.status as any);
      }
      
      const data = await res.json();
      return c.json(data);
    }
  );
