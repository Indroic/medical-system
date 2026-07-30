import { toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import RiesgoBadge from "@/components/riesgo-badge";
import { useAuthStore } from "@/lib/auth-store";
import { reportesApi } from "@/lib/python-api";
import type { ReporteResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/reportes/")({
  component: ReportesList,
});

function ReportesList() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [reportes, setReportes] = useState<ReporteResponse[]>([]);
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    reportesApi
      .listar(token, soloPendientes)
      .then((res) => setReportes(res.items))
      .catch(() => toast.danger("Error cargando reportes"))
      .finally(() => setLoading(false));
  }, [token, soloPendientes]);

  const pendientes = reportes.filter((r) => r.editable).length;

  return (
    <div className="p-8">
      <PageHeader
        title="Reportes"
        subtitle={
          soloPendientes
            ? `${pendientes} pendientes de aprobación`
            : `${reportes.length} reportes en total`
        }
        action={
          <div className="inline-flex rounded-full border border-border p-0.5">
            {[
              { label: "Pendientes", value: true },
              { label: "Todos", value: false },
            ].map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => setSoloPendientes(value)}
                aria-pressed={soloPendientes === value}
                className={[
                  "rounded-full px-3 py-1.5 text-[13px] transition-colors",
                  soloPendientes === value
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-8">
        {loading ? (
          <div className="rounded-cards bg-surface shadow-surface p-8 text-center text-[13px] text-muted">
            Cargando…
          </div>
        ) : reportes.length === 0 ? (
          <div className="rounded-cards bg-surface shadow-surface p-12 text-center">
            <p className="text-[14px] text-foreground mb-2">
              {soloPendientes ? "Nada pendiente" : "Sin reportes"}
            </p>
            <p className="text-[13px] text-muted">
              {soloPendientes
                ? "Todos los reportes están aprobados."
                : "Los reportes se generan automáticamente al completarse un análisis."}
            </p>
          </div>
        ) : (
          <div className="rounded-cards bg-surface shadow-surface overflow-hidden overflow-x-auto">
            <table className="w-full text-[13px] min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="px-4 py-3 text-left text-muted font-normal">Estudio</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Estado</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Riesgo</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Hallazgos</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Observaciones</th>
                  <th className="px-4 py-3 text-right text-muted font-normal">Acción</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map((r, i) => (
                  <tr
                    key={r.reporte_id}
                    className={i < reportes.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="px-4 py-3 font-mono text-muted">
                      {r.estudio_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={r.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <RiesgoBadge nivel={r.nivel_riesgo} />
                    </td>
                    <td className="px-4 py-3 text-muted">{r.total_hallazgos}</td>
                    <td className="px-4 py-3 text-muted">
                      {r.observaciones?.trim() ? "Sí" : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: "/estudios/$estudioId",
                            params: { estudioId: r.estudio_id },
                          })
                        }
                        className="text-link font-medium hover:underline"
                      >
                        {r.editable ? "Editar →" : "Ver →"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
