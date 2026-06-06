import { authClient } from "@/lib/auth-client";

const BASE = "https://medicalserver.indroic.dev";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };


  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Eliminar cualquier slash al final del BASE y al principio del path para unirlos de forma segura
  const cleanBase = BASE.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${cleanBase}${cleanPath}`;

  const res = await fetch(targetUrl, { ...options, headers, credentials: "include" });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.detail ?? data.message ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface PacienteResponse {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  documento_identidad: string;
}

export interface PacienteListResponse {
  items: PacienteResponse[];
  total: number;
}

export interface EstudioResponse {
  id: string;
  paciente_id: string;
  imagen_path: string;
  mime_type: string;
  estado: "PENDIENTE" | "EN_ANALISIS" | "COMPLETADO";
  medico_id: string;
}

export interface EstudioListResponse {
  items: EstudioResponse[];
  total: number;
}

export interface HallazgoDTO {
  etiqueta: string;
  confianza: number;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  es_critico: boolean;
}

export interface AnalisisResponse {
  analisis_id: string;
  estudio_id: string;
  estado: string;
  nivel_riesgo: "BAJO" | "MODERADO" | "CRITICO" | "NO_EVALUADO";
  hallazgos: HallazgoDTO[];
  total_hallazgos: number;
}

export interface ReporteResponse {
  reporte_id: string;
  estado: "GENERANDO" | "LISTO" | "FALLIDO";
  nivel_riesgo: string;
  total_hallazgos: number;
  pdf_disponible: boolean;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const usuariosApi = {
  me: (token: string) =>
    request<UserResponse>("/api/usuarios/me", {}, token),
};

// ─── Pacientes ──────────────────────────────────────────────────────────────

export const pacientesApi = {
  crear: (
    token: string,
    data: { nombre: string; apellido: string; fecha_nacimiento: string; documento_identidad: string },
  ) =>
    request<PacienteResponse>("/api/pacientes", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  obtener: (token: string, id: string) =>
    request<PacienteResponse>(`/api/pacientes/${id}`, {}, token),

  listar: (token: string) =>
    request<PacienteListResponse>("/api/pacientes", {}, token),
};

// ─── Estudios ───────────────────────────────────────────────────────────────

export const estudiosApi = {
  crear: (token: string, pacienteId: string, file: File) => {
    const form = new FormData();
    form.append("paciente_id", pacienteId);
    form.append("archivo", file);
    return request<EstudioResponse>("/api/estudios", {
      method: "POST",
      body: form,
    }, token);
  },

  listar: (token: string) =>
    request<EstudioListResponse>("/api/estudios", {}, token),

  obtener: (token: string, id: string) =>
    request<EstudioResponse>(`/api/estudios/${id}`, {}, token),
};

// ─── Análisis ───────────────────────────────────────────────────────────────

export const analisisApi = {
  ejecutar: (token: string, estudio_id: string, imagen_path: string) =>
    request<AnalisisResponse>("/api/analisis", {
      method: "POST",
      body: JSON.stringify({ estudio_id, imagen_path }),
    }, token),

  obtener: (token: string, estudio_id: string) =>
    request<AnalisisResponse>(`/api/analisis/${estudio_id}`, {}, token),
};

// ─── Reportes ───────────────────────────────────────────────────────────────

export const reportesApi = {
  obtener: (token: string, estudio_id: string) =>
    request<ReporteResponse>(`/api/reportes/${estudio_id}`, {}, token),

  urlDescarga: (estudio_id: string) => {
    const cleanBase = BASE.replace(/\/+$/, "");
    return `${cleanBase}/api/reportes/${estudio_id}/descargar`;
  }
};
