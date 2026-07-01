import { toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { client } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";
import type { EstudioResponse, EstudioListResponse } from "@/lib/api-client";
import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import StatCard from "@/components/stat-card";
import { useOverlayState } from "@heroui/react";
import NuevoPacienteModal from "@/components/nuevo-paciente-modal";
import NuevoEstudioModal from "@/components/nuevo-estudio-modal";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const nuevoEstudioState = useOverlayState({ defaultOpen: false });
  const nuevoPacienteState = useOverlayState({ defaultOpen: false });
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["estudios"],
    queryFn: async () => {
      const res = await client.api.estudios.$get();
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
          <span className="inline-flex items-center rounded-full bg-surface px-3 py-1 text-[12px] text-muted border border-border">
            {user?.rol === "admin" ? "Administrador" : "Médico"}
          </span>
        }
      />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Estudios totales" value={estudios.length} loading={loading} />
        <StatCard label="Pendientes" value={pendientes} loading={loading} />
        <StatCard label="Completados" value={completados} loading={loading} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] text-ash">Estudios recientes</h2>
          <button
            type="button"
            onClick={() => navigate({ to: "/estudios" })}
            className="text-[13px] text-muted hover:text-ash transition-colors"
          >
            Ver todos →
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border p-8 text-center text-[13px] text-muted">
            Cargando…
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-border p-8 text-center text-[13px] text-muted">
            No hay estudios aún.{" "}
            <button
              type="button"
              onClick={nuevoEstudioState.open}
              className="text-link font-medium hover:underline"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-[13px] min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-muted font-normal">Estudio ID</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Estado</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Tipo</th>
                  <th className="px-4 py-3 text-right text-muted font-normal">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((estudio, i) => (
                  <tr key={estudio.id} className={i < recent.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-mono text-ash truncate max-w-[200px]">
                      {estudio.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3"><EstadoBadge estado={estudio.estado} /></td>
                    <td className="px-4 py-3 text-muted">{estudio.mime_type}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/estudios/$estudioId", params: { estudioId: estudio.id } })}
                        className="text-link font-medium hover:underline"
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

      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={nuevoEstudioState.open}
          className="rounded-full bg-accent px-5 py-2 text-[14px] font-medium text-accent-foreground hover:bg-accent-hover transition-colors text-center w-full sm:w-auto"
        >
          Nuevo estudio
        </button>
        <button
          type="button"
          onClick={nuevoPacienteState.open}
          className="rounded-full border border-border px-5 py-2 text-[14px] text-foreground hover:bg-surface-hover hover:border-field-border transition-colors text-center w-full sm:w-auto"
        >
          Nuevo paciente
        </button>
      </div>

      <NuevoEstudioModal state={nuevoEstudioState} />
      <NuevoPacienteModal state={nuevoPacienteState} />
    </div>
  );
}
