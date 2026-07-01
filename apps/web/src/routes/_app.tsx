import { useEffect, useState } from "react";
import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart2, FileText, Scan, Users, UserCog, Menu, X } from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";
import { ModeToggle } from "@/components/mode-toggle";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context: _ctx }) => {
    const token = localStorage.getItem("ms_token");
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/estudios", label: "Estudios", icon: Scan },
  { to: "/usuarios", label: "Usuarios", icon: UserCog, adminOnly: true },
];

function AppLayout() {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
    }
  }, [token, navigate]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate({ to: "/login" });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout, navigate]);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.rol === "admin"
  );

  return (
    <div className="flex flex-col lg:flex-row h-svh bg-background font-sans overflow-hidden">
      {/* Barra superior móvil */}
      <header className="flex lg:hidden h-14 items-center justify-between border-b border-border bg-background px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent">
            <Scan size={13} className="text-accent-foreground" />
          </div>
          <span className="text-[13px] font-medium tracking-tight text-foreground">
            MedImaging
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Menú móvil lateral (Overlay / Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/85 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <aside className="relative flex w-64 max-w-[80vw] h-full flex-col border-r border-border bg-background p-4 z-10 transition-transform duration-300">
            {/* Header Drawer */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-accent">
                  <Scan size={13} className="text-accent-foreground" />
                </div>
                <span className="text-[13px] font-medium tracking-tight text-foreground">
                  MedImaging
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-1 flex-1">
              {visibleNavItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to || location.pathname.startsWith(to + "/");
                return (
                  <button
                    key={to}
                    type="button"
                    onClick={() => navigate({ to })}
                    className={[
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors text-left w-full",
                      active
                        ? "bg-ash text-snow font-medium"
                        : "text-muted hover:bg-surface-hover hover:text-ash",
                    ].join(" ")}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* User + logout */}
            <div className="border-t border-border pt-4 mt-auto">
              {user && (
                <div className="mb-2 px-3">
                  <p className="text-[13px] font-medium text-foreground truncate">{user.nombre}</p>
                  <p className="text-[12px] text-muted truncate">{user.email}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-surface-hover hover:text-ash text-left transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar para pantallas grandes */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-border bg-background shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent">
            <Scan size={13} className="text-accent-foreground" />
          </div>
          <span className="text-[13px] font-medium tracking-tight text-foreground">
            MedImaging
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          {visibleNavItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate({ to })}
                className={[
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors text-left w-full",
                  active
                    ? "bg-ash text-snow font-medium"
                    : "text-muted hover:bg-surface-hover hover:text-ash",
                ].join(" ")}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-border p-2">
          <ModeToggle />
          {user && (
            <div className="mb-1 px-3 py-2">
              <p className="text-[13px] font-medium text-foreground truncate">{user.nombre}</p>
              <p className="text-[12px] text-muted truncate">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-surface-hover hover:text-ash text-left transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto bg-background w-full">
        <Outlet />
      </main>
    </div>
  );
}
