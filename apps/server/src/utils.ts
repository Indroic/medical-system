import { Context } from "hono";
import { auth } from "./index";
import { env } from "@medical-system/env/server";

export async function getAuthToken(c: Context): Promise<string | undefined> {
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    return authHeader.replace("Bearer ", "");
  }
  
  // Generar JWT directamente en el servidor invocando el handler de auth
  try {
    const req = new Request(`${env.VITE_SERVER_URL || "http://localhost:3000"}/api/auth/token`, {
      method: "GET",
      headers: c.req.raw.headers,
    });
    const res = await auth.handler(req);
    if (res.ok) {
      const data = await res.json();
      return data.token;
    }
  } catch (e) {
    console.error("Error al generar JWT en servidor:", e);
  }
  return undefined;
}
