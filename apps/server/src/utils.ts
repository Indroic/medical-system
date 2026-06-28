import { Context } from "hono";
import { auth } from "@medical-system/auth";
import { env } from "@medical-system/env/server";

export async function getAuthToken(c: Context): Promise<string | undefined> {
  
  // Generar JWT directamente usando el handler en memoria (sin red)
  try {
    const req = new Request(`${env.BETTER_AUTH_URL}/api/auth/token`, {
      method: "GET",
      headers: c.req.raw.headers,
    });
    const res = await auth.handler(req);
    if (res.ok) {
      const data = (await res.json()) as { token?: string };
      return data.token;
    }
  } catch (e) {
    console.error("Error al generar JWT en servidor:", e);
  }
  return undefined;
}
