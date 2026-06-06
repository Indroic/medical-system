import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { env } from "@medical-system/env/server";
import { getAuthToken } from "../utils";

export const pacientes = new Hono()
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const token = getAuthToken(c);
    
    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/pacientes/${id}`, {
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
        nombre: z.string(),
        apellido: z.string(),
        fecha_nacimiento: z.string(),
        documento_identidad: z.string(),
      })
    ),
    async (c) => {
      const body = c.req.valid("json");
      const token = getAuthToken(c);
      
      const res = await fetch(`${env.PYTHON_API_URL}/api/v1/pacientes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        return c.json({ error: "Failed to create resource" }, res.status as any);
      }
      
      const data = await res.json();
      return c.json(data);
    }
  );
