import { hc } from "hono/client";
import type { AppType } from "../../../server/src/index";

// Hardcodeado temporalmente para asegurar que apunte al Hono Server y no a sí mismo
const SERVER_URL = "https://medicalserver.indroic.dev";

export const client = hc<AppType>(SERVER_URL, {
  init: {
    credentials: "include",
  },
});

// Exportar los mismos tipos que definimos previamente para su uso en UI, o usar los inferidos.
export type { UserResponse, PacienteResponse, EstudioResponse, AnalisisResponse, HallazgoDTO, ReporteResponse, EstudioListResponse } from "./python-api";
