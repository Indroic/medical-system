import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/auth-store";
import { ApiError, estudiosApi, pacientesApi } from "@/lib/python-api";
import type { EstudioResponse } from "@/lib/python-api";
import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import StatCard from "@/components/stat-card";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [estudios, setEstudios] = useState<EstudioResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    estudiosApi
      .listar(token)
      .then((res) => setEstudios(res.items))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          navigate({ to: "/login" });
        } else {
          toast.error("Error cargando estudios");
        }
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const completados = estudios.filter((e) => e.estado === "COMPLETADO").length;
  const pendientes = estudios.filter((e) => e.estado === "PENDIENTE").length;
  const recent = estudios.slice(0, 5);

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle={user ? `Bienvenido, ${user.nombre}` : undefined}
        action={
          <span className="inline-flex items-center rounded-[26px] bg-mist px-3 py-1 text-[12px] font-medium text-graphite border border-hairline">
            {user?.rol === "admin" ? "Administrador" : "Médico"}
          </span>
        }
      />

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <StatCard label="Estudios totales" value={estudios.length} loading={loading} />
        <StatCard label="Pendientes" value={pendientes} loading={loading} />
        <StatCard label="Completados" value={completados} loading={loading} />
      </div>

      {/* Recent studies */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-graphite">Estudios recientes</h2>
          <button
            type="button"
            onClick={() => navigate({ to: "/estudios" })}
            className="text-[13px] text-concrete hover:text-graphite transition-colors"
          >
            Ver todos →
          </button>
        </div>

        {loading ? (
          <div className="rounded-[14px] border border-hairline p-8 text-center text-[13px] text-concrete">
            Cargando…
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-[14px] border border-hairline p-8 text-center text-[13px] text-concrete">
            No hay estudios aún.{" "}
            <button
              type="button"
              onClick={() => navigate({ to: "/estudios/nuevo", search: { pacienteId: undefined } })}
              className="text-graphite font-medium hover:underline"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="rounded-[14px] border border-hairline overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-hairline bg-mist">
                  <th className="px-4 py-3 text-left font-medium text-concrete">Estudio ID</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium text-concrete">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((estudio, i) => (
                  <tr
                    key={estudio.id}
                    className={i < recent.length - 1 ? "border-b border-hairline" : ""}
                  >
                    <td className="px-4 py-3 font-mono text-graphite truncate max-w-[200px]">
                      {estudio.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={estudio.estado} />
                    </td>
                    <td className="px-4 py-3 text-concrete">{estudio.mime_type}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/estudios/$estudioId", params: { estudioId: estudio.id } })}
                        className="text-graphite font-medium hover:underline"
                      >
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-10 flex gap-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/estudios/nuevo", search: { pacienteId: undefined } })}
          className="rounded-[10px] bg-graphite px-5 py-2.5 text-[14px] font-medium text-chalk hover:bg-carbon transition-colors"
        >
          Nuevo estudio
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/pacientes/nuevo" })}
          className="rounded-[10px] border border-hairline px-5 py-2.5 text-[14px] font-medium text-graphite hover:bg-mist transition-colors"
        >
          Nuevo paciente
        </button>
      </div>
    </div>
  );
}
