import { Context } from "hono";
import { getCookie } from "hono/cookie";

export function getAuthToken(c: Context): string | undefined {
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    return authHeader.replace("Bearer ", "");
  }
  return getCookie(c, "better-auth.session_token") || getCookie(c, "__Secure-better-auth.session_token");
}
