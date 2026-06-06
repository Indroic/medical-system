import { Hono } from "hono";
import { env } from "@medical-system/env/server";
import { getAuthToken } from "../utils";

export const usuarios = new Hono()
  .get("/me", async (c) => {
    const token = getAuthToken(c);
    
    const res = await fetch(`${env.PYTHON_API_URL}/api/v1/usuarios/me`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    
    if (!res.ok) {
      return c.json({ error: "Failed to fetch from API" }, res.status as any);
    }
    
    const data = await res.json();
    return c.json(data);
  });
