import { Context } from "hono";
import { auth } from "@medical-system/auth";
import { env } from "@medical-system/env/server";

export async function getAuthToken(c: Context): Promise<string | undefined> {
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    return authHeader.replace("Bearer ", "");
  }
  
  // Generar JWT directamente usando el plugin de better-auth
  try {
    const data = await auth.api.token({
      headers: c.req.raw.headers,
    });
    return data?.token;
  } catch (e) {
    console.error("Error al generar JWT en servidor:", e);
  }
  return undefined;
}
