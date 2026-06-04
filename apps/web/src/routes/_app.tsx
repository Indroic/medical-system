import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart2, FileText, Scan, Users } from "lucide-react";

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
  { to: "/reportes", label: "Reportes", icon: FileText },
];

function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-svh bg-chalk font-sans">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-hairline bg-chalk">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-hairline">
          <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-graphite">
            <Scan size={14} className="text-chalk" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-graphite">
            MedImaging
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate({ to })}
                className={[
                  "flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-colors text-left w-full",
                  active
                    ? "bg-graphite text-chalk"
                    : "text-concrete hover:bg-mist hover:text-graphite",
                ].join(" ")}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-hairline p-3">
          {user && (
            <div className="mb-2 px-3 py-2">
              <p className="text-[13px] font-medium text-graphite truncate">{user.nombre}</p>
              <p className="text-[12px] text-concrete truncate">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-[10px] px-3 py-2 text-[13px] text-concrete hover:bg-mist hover:text-graphite text-left transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-chalk">
        <Outlet />
      </main>
    </div>
  );
}
