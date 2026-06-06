import { toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { client } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import type { EstudioResponse, EstudioListResponse } from "@/lib/api-client";
import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import StatCard from "@/components/stat-card";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["estudios"],
    queryFn: async () => {
      const { data: jwtData } = await authClient.jwt();
      const jwtToken = jwtData?.token || token; // Fallback al store viejo por si acaso
      
      const res = await client.api.estudios.$get({
        header: {
          Authorization: `Bearer ${jwtToken}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          navigate({ to: "/login" });
          throw new Error("Unauthorized");
        }
        throw new Error("Error cargando estudios");
      }
      const data = (await res.json()) as unknown as EstudioListResponse;
      return data.items;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (error && error.message !== "Unauthorized") {
      toast.danger("Error cargando estudios");
    }
  }, [error]);

  const estudios = data || [];

  const completados = estudios.filter((e) => e.estado === "COMPLETADO").length;
  const pendientes = estudios.filter((e) => e.estado === "PENDIENTE").length;
  const recent = estudios.slice(0, 5);

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle={user ? `Bienvenido, ${user.nombre}` : undefined}
        action={
          <span className="inline-flex items-center rounded-full bg-ash px-3 py-1 text-[12px] text-smoke border border-charcoal">
            {user?.rol === "admin" ? "Administrador" : "Médico"}
          </span>
        }
      />

      <div className="mt-8 grid grid-cols-3 gap-4">
        <StatCard label="Estudios totales" value={estudios.length} loading={loading} />
        <StatCard label="Pendientes" value={pendientes} loading={loading} />
        <StatCard label="Completados" value={completados} loading={loading} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] text-silver">Estudios recientes</h2>
          <button
            type="button"
            onClick={() => navigate({ to: "/estudios" })}
            className="text-[13px] text-smoke hover:text-silver transition-colors"
          >
            Ver todos →
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke">
            Cargando…
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke">
            No hay estudios aún.{" "}
            <button
              type="button"
              onClick={() => navigate({ to: "/estudios/nuevo", search: { pacienteId: undefined } })}
              className="text-green font-medium hover:underline"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-charcoal overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-charcoal bg-ash">
                  <th className="px-4 py-3 text-left text-smoke font-normal">Estudio ID</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Estado</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Tipo</th>
                  <th className="px-4 py-3 text-right text-smoke font-normal">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((estudio, i) => (
                  <tr key={estudio.id} className={i < recent.length - 1 ? "border-b border-charcoal" : ""}>
                    <td className="px-4 py-3 font-mono text-silver truncate max-w-[200px]">
                      {estudio.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3"><EstadoBadge estado={estudio.estado} /></td>
                    <td className="px-4 py-3 text-smoke">{estudio.mime_type}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/estudios/$estudioId", params: { estudioId: estudio.id } })}
                        className="text-green font-medium hover:underline"
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

      <div className="mt-10 flex gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/estudios/nuevo", search: { pacienteId: undefined } })}
          className="rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep transition-colors"
        >
          Nuevo estudio
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/pacientes/nuevo" })}
          className="rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-ash hover:border-slate transition-colors"
        >
          Nuevo paciente
        </button>
      </div>
    </div>
  );
}
