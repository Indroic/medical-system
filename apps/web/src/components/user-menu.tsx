import { LogOut } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import { useAuthStore } from "@/lib/auth-store";

interface UserMenuProps {
  /** En el sidebar colapsado sólo se muestran los iconos. */
  collapsed?: boolean;
}

/**
 * Identidad de la sesión + salida.
 *
 * Lee de `useAuthStore` (el token `ms_token`), que es la fuente real de la
 * sesión en esta app; antes consultaba `authClient.useSession()`, que siempre
 * devolvía `null` aquí y dejaba el sidebar mostrando un botón "Sign In".
 */
export default function UserMenu({ collapsed = false }: UserMenuProps) {
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login", search: {} });
  };

  if (isLoading) {
    return <div className="h-8 w-full animate-pulse rounded-lg bg-surface-secondary" />;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="w-full rounded-full border border-border px-3 py-1.5 text-center text-[13px] text-foreground hover:bg-surface-hover transition-colors"
      >
        Iniciar sesión
      </Link>
    );
  }

  const iniciales = user.nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");

  const botonSalir = (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className="flex items-center justify-center rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-danger transition-colors"
    >
      <LogOut size={15} aria-hidden="true" />
    </button>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          title={`${user.nombre} · ${user.email}`}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[11px] font-medium text-accent"
        >
          {iniciales}
        </span>
        {botonSalir}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-medium text-accent">
        {iniciales}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-foreground">{user.nombre}</p>
        <p className="truncate text-[11px] text-muted">{user.email}</p>
      </div>
      {botonSalir}
    </div>
  );
}
