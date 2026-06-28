import { hc } from "hono/client";
import type { AppType } from "../../../server/src/index";
import { env } from "@medical-system/env/web";

// Por defecto, mismo origen: el nginx de 'web' proxyea /api -> server Node.
// En dev, VITE_SERVER_URL=http://localhost:3000 apunta directo al server.
const SERVER_URL = env.VITE_SERVER_URL.startsWith("http")
  ? env.VITE_SERVER_URL.replace(/\/+$/, "")
  : typeof window !== "undefined"
    ? window.location.origin
    : "";

export const client = hc<AppType>(SERVER_URL, {
  init: {
    credentials: "include",
  },
});

// Exportar los mismos tipos que definimos previamente para su uso en UI, o usar los inferidos.
export type { UserResponse, PacienteResponse, EstudioResponse, AnalisisResponse, HallazgoDTO, ReporteResponse, EstudioListResponse } from "./python-api";
