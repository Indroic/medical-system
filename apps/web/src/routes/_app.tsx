import { useEffect } from "react";
import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart2, FileText, Scan, Users, UserCog } from "lucide-react";

import { useAuthStore } from "@/lib/auth-store";

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

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.rol === "admin"
  );

  return (
    <div className="flex h-svh bg-obsidian font-sans">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-charcoal bg-obsidian">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-charcoal">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-green">
            <Scan size={13} className="text-obsidian" />
          </div>
          <span className="text-[13px] font-medium tracking-tight text-snow">
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
                    : "text-smoke hover:bg-ash hover:text-silver",
                ].join(" ")}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-charcoal p-2">
          {user && (
            <div className="mb-1 px-3 py-2">
              <p className="text-[13px] font-medium text-snow truncate">{user.nombre}</p>
              <p className="text-[12px] text-smoke truncate">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-[13px] text-smoke hover:bg-ash hover:text-silver text-left transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-obsidian">
        <Outlet />
      </main>
    </div>
  );
}
