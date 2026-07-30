/**
 * Destino post-login según el rol (§1.1).
 *
 * Un admin entra directamente a la gestión de usuarios/accesos, que es su área
 * de trabajo; el resto de roles aterriza en el dashboard clínico.
 */
const LANDING_POR_ROL: Record<string, string> = {
  admin: "/usuarios",
};

export const LANDING_POR_DEFECTO = "/dashboard";

export function landingParaRol(rol: string | undefined | null): string {
  if (!rol) return LANDING_POR_DEFECTO;
  return LANDING_POR_ROL[rol] ?? LANDING_POR_DEFECTO;
}

/**
 * Valida el `?redirect=` de la URL de login antes de navegar a él.
 *
 * Sólo se aceptan rutas internas absolutas: sin esto, un enlace del tipo
 * `/login?redirect=https://malicioso.example` convertiría el login en un
 * redirector abierto. Se rechaza también `//host`, que el navegador
 * interpretaría como URL protocol-relative.
 */
export function esRedirectInterno(destino: string | undefined): destino is string {
  if (!destino) return false;
  return destino.startsWith("/") && !destino.startsWith("//");
}

/** Ruta a la que enviar al usuario tras autenticarse. */
export function destinoPostLogin(
  redirect: string | undefined,
  rol: string | undefined | null,
): string {
  return esRedirectInterno(redirect) ? redirect : landingParaRol(rol);
}
