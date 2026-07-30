import { useEffect, useState } from "react";
import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart2,
  FileText,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Scan,
  UserCog,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem("ms_token");
    if (!token) {
      // Se propaga la ruta actual para poder volver a ella tras el login.
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AppLayout,
});

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/** Módulos del sistema. Los `adminOnly` los filtra el RBAC más abajo. */
const NAV_SECTIONS: NavSection[] = [
  {
    title: "Clínico",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: BarChart2 },
      { to: "/pacientes", label: "Pacientes", icon: Users },
      { to: "/estudios", label: "Estudios e imágenes", icon: Scan },
      { to: "/reportes", label: "Reportes", icon: FileText },
    ],
  },
  {
    title: "Administración",
    items: [
      { to: "/usuarios", label: "Usuarios y accesos", icon: UserCog, adminOnly: true },
    ],
  },
];

const COLLAPSE_KEY = "ms_sidebar_collapsed";

function AppLayout() {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true",
  );

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login", search: {} });
    }
  }, [token, navigate]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate({ to: "/login", search: { redirect: location.href } });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout, navigate, location.href]);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, String(!prev));
      return !prev;
    });
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login", search: {} });
  };

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  // RBAC: se ocultan los items restringidos y las secciones que queden vacías.
  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.adminOnly || user?.rol === "admin"),
  })).filter((section) => section.items.length > 0);

  const renderNav = (collapsed: boolean) => (
    <nav className="flex flex-col gap-4 flex-1" aria-label="Navegación principal">
      {visibleSections.map((section) => (
        <div key={section.title} className="flex flex-col gap-0.5">
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
              {section.title}
            </p>
          )}
          {section.items.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate({ to: to as never })}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={[
                  "flex items-center rounded-nav py-2 text-[13px] transition-colors text-left w-full",
                  collapsed ? "justify-center px-2" : "gap-2.5 px-3",
                  active
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-muted hover:bg-surface-hover hover:text-foreground",
                ].join(" ")}
              >
                <Icon size={14} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
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

            {renderNav(false)}

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
                className="w-full rounded-lg px-3 py-2 text-[13px] text-muted hover:bg-surface-hover hover:text-foreground text-left transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar para pantallas grandes */}
      <aside
        className={[
          "hidden lg:flex flex-col border-r border-border bg-background shrink-0 transition-[width] duration-200",
          isCollapsed ? "w-16" : "w-56",
        ].join(" ")}
      >
        {/* Logo */}
        <div
          className={[
            "flex items-center border-b border-border py-4",
            isCollapsed ? "justify-center px-2" : "gap-2.5 px-4",
          ].join(" ")}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent shrink-0">
            <Scan size={13} className="text-accent-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-[13px] font-medium tracking-tight text-foreground truncate">
              MedImaging
            </span>
          )}
        </div>

        <div className="flex flex-col flex-1 p-2 gap-2 overflow-y-auto">
          {renderNav(isCollapsed)}

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            className={[
              "flex items-center rounded-nav py-2 text-[13px] text-muted hover:bg-surface-hover hover:text-foreground transition-colors",
              isCollapsed ? "justify-center px-2" : "gap-2.5 px-3",
            ].join(" ")}
          >
            {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            {!isCollapsed && <span>Colapsar</span>}
          </button>
        </div>

        {/* User + tema */}
        <div className="border-t border-border p-2 flex flex-col items-center justify-between gap-2">
          {!isCollapsed && (
            <span className="text-[11px] font-medium text-muted uppercase tracking-wide px-1">
              Tema
            </span>
          )}
          <ModeToggle />
          <UserMenu />
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto bg-background w-full">
        <Outlet />
      </main>
    </div>
  );
}
