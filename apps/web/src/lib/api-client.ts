import { hc } from "hono/client";
import type { AppType } from "../../../server/src/index";
import { env } from "@medical-system/env/web";

export const client = hc<AppType>(env.VITE_SERVER_URL || "http://localhost:3000", {
  init: {
    credentials: "include",
  },
});

// Exportar los mismos tipos que definimos previamente para su uso en UI, o usar los inferidos.
export type { UserResponse, PacienteResponse, EstudioResponse, AnalisisResponse, HallazgoDTO, ReporteResponse, EstudioListResponse } from "./python-api";
