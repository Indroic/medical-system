import { Hono } from "hono";
import { env } from "@medical-system/env/server";

export const usuarios = new Hono()
  .get("/me", async (c) => {
    const token = c.req.header("Authorization");
    
    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/usuarios/me`, {
      headers: { ...(token ? { Authorization: token } : {}) },
    });
    
    if (!res.ok) {
      return c.json({ error: "Failed to fetch from API" }, res.status as any);
    }
    
    const data = await res.json();
    return c.json(data);
  });
