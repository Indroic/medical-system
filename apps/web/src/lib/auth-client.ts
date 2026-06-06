import { env } from "@medical-system/env/web";
import { createAuthClient } from "better-auth/react";

// Better-Auth requires an absolute URL. When VITE_SERVER_URL is a relative
// nginx proxy path (e.g. /server), prefix it with the current origin at runtime.
const serverBaseURL = env.VITE_SERVER_URL.startsWith("http")
  ? env.VITE_SERVER_URL.replace(/\/+$/, "")
  : `${window.location.origin}${env.VITE_SERVER_URL}`.replace(/\/+$/, "");

export const authClient = createAuthClient({
  baseURL: `${serverBaseURL}/api/auth`,
});
