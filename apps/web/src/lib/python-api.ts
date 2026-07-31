import { authClient } from "@/lib/auth-client";
import { env } from "@medical-system/env/web";

// Por defecto, mismo origen: el nginx de 'web' proxyea /api -> server Node.
// En dev, VITE_SERVER_URL=http://localhost:3000 apunta directo al server.
const BASE = env.VITE_SERVER_URL.startsWith("http")
  ? env.VITE_SERVER_URL.replace(/\/+$/, "")
  : typeof window !== "undefined"
    ? window.location.origin
    : "";

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
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }
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
  imagenes_paths: string[];
  mime_type: string;
  estado: "PENDIENTE" | "EN_ANALISIS" | "COMPLETADO" | "FALLIDO";
  medico_id: string;
}

export interface EstudioListResponse {
  items: EstudioResponse[];
  total: number;
}

export interface SubirImagenResponse {
  path: string;
  mime_type: string;
}

export interface HallazgoDTO {
  etiqueta: string;
  confianza: number;
  /** Coordenadas en el espacio de píxeles de la imagen ORIGINAL. */
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  es_critico: boolean;
  image_index: number;
  /**
   * Tamaño de la imagen original sobre la que se calculó el bbox. Necesario
   * porque el visor muestra una versión redimensionada por imgproxy: sin esto
   * el bbox se dibuja a la escala equivocada.
   * 0 = desconocido (análisis anteriores a este campo).
   */
  img_width: number;
  img_height: number;
}

export interface AnalisisResponse {
  analisis_id: string;
  estudio_id: string;
  estado: string;
  nivel_riesgo: "BAJO" | "MODERADO" | "CRITICO" | "NO_EVALUADO";
  hallazgos: HallazgoDTO[];
  total_hallazgos: number;
  informe_avanzado_ia?: string;
}

export type ReporteEstado = "GENERANDO" | "LISTO" | "FALLIDO" | "APROBADO";

export interface ReporteResponse {
  reporte_id: string;
  estudio_id: string;
  /** APROBADO es terminal: el reporte queda inmutable. */
  estado: ReporteEstado;
  nivel_riesgo: string;
  total_hallazgos: number;
  pdf_disponible: boolean;
  observaciones: string | null;
  /** Lo calcula el backend (`Reporte.esta_editable`); no replicar la regla aquí. */
  editable: boolean;
  aprobado_por: string | null;
  aprobado_en: string | null;
}

export interface ReporteListResponse {
  items: ReporteResponse[];
  total: number;
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
  subirImagen: (token: string, file: File) => {
    const form = new FormData();
    form.append("archivo", file);
    return request<SubirImagenResponse>("/api/estudios/imagenes", {
      method: "POST",
      body: form,
    }, token);
  },

  crear: async (token: string, pacienteId: string, files: File[]) => {
    const subidas = await Promise.all(files.map(file => estudiosApi.subirImagen(token, file)));
    return request<EstudioResponse>("/api/estudios", {
      method: "POST",
      body: JSON.stringify({
        paciente_id: pacienteId,
        imagenes_paths: subidas.map(s => s.path),
        mime_type: subidas[0]?.mime_type ?? "application/octet-stream",
      }),
    }, token);
  },

  /**
   * Sin `pacienteId`: estudios del médico autenticado.
   * Con `pacienteId`: historial completo de ese paciente (de cualquier médico),
   * filtrado en el servidor — antes se traía la lista entera y se filtraba en
   * el cliente, lo que ocultaba los estudios subidos por otros profesionales.
   */
  listar: (token: string, pacienteId?: string) =>
    request<EstudioListResponse>(
      pacienteId
        ? `/api/estudios?paciente_id=${encodeURIComponent(pacienteId)}`
        : "/api/estudios",
      {},
      token,
    ),

  obtener: (token: string, id: string) =>
    request<EstudioResponse>(`/api/estudios/${id}`, {}, token),
};

// ─── Análisis ───────────────────────────────────────────────────────────────

export const analisisApi = {
  ejecutar: (token: string, estudio_id: string, imagenes_paths: string[]) =>
    request<AnalisisResponse>("/api/analisis", {
      method: "POST",
      body: JSON.stringify({ estudio_id, imagenes_paths }),
    }, token),

  obtener: (token: string, estudio_id: string) =>
    request<AnalisisResponse>(`/api/analisis/${estudio_id}`, {}, token),
};

// ─── Reportes ───────────────────────────────────────────────────────────────

export const reportesApi = {
  obtener: (token: string, estudio_id: string) =>
    request<ReporteResponse>(`/api/reportes/${estudio_id}`, {}, token),

  /** `soloPendientes` devuelve únicamente los reportes que aún admiten edición. */
  listar: (token: string, soloPendientes = false) =>
    request<ReporteListResponse>(
      soloPendientes ? "/api/reportes?pendientes=true" : "/api/reportes",
      {},
      token,
    ),

  /**
   * Edita un reporte pendiente. Los campos omitidos no se modifican.
   * Lanza ApiError con status 409 si el reporte ya está aprobado.
   */
  actualizar: (
    token: string,
    estudio_id: string,
    data: { observaciones?: string; nivel_riesgo?: string },
  ) =>
    request<ReporteResponse>(`/api/reportes/${estudio_id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  /** Transición terminal: bloquea la edición y registra quién aprobó. */
  aprobar: (token: string, estudio_id: string) =>
    request<ReporteResponse>(`/api/reportes/${estudio_id}/aprobar`, {
      method: "POST",
    }, token),

  urlDescarga: (estudio_id: string) => {
    const cleanBase = BASE.replace(/\/+$/, "");
    return `${cleanBase}/api/reportes/${estudio_id}/descargar`;
  }
};
