import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, estudiosApi, reportesApi } from "@/lib/python-api";
import type { EstudioResponse, ReporteResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/reportes/")({
  component: ReportesList,
});

interface EstudioConReporte {
  estudio: EstudioResponse;
  reporte: ReporteResponse | null;
}

function ReportesList() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<EstudioConReporte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    estudiosApi
      .listar(token)
      .then(async (res) => {
        const completados = res.items.filter((e) => e.estado === "COMPLETADO");
        const withReportes = await Promise.all(
          completados.map(async (e) => {
            try {
              const r = await reportesApi.obtener(token, e.id);
              return { estudio: e, reporte: r };
            } catch {
              return { estudio: e, reporte: null };
            }
          }),
        );
        setItems(withReportes);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Error cargando reportes"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-8">
      <PageHeader
        title="Reportes"
        subtitle="Estudios completados con reportes generados"
      />

      <div className="mt-8">
        {loading ? (
          <div className="rounded-[14px] border border-hairline p-8 text-center text-[13px] text-concrete">
            Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[14px] border border-hairline p-12 text-center">
            <p className="text-[14px] font-medium text-graphite mb-2">Sin reportes disponibles</p>
            <p className="text-[13px] text-concrete">
              Los reportes aparecen aquí una vez completado el análisis de un estudio.
            </p>
          </div>
        ) : (
          <div className="rounded-[14px] border border-hairline overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-hairline bg-mist">
                  <th className="px-4 py-3 text-left font-medium text-concrete">Estudio</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Estado estudio</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Estado reporte</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Nivel riesgo</th>
                  <th className="px-4 py-3 text-right font-medium text-concrete">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ estudio, reporte }, i) => (
                  <tr
                    key={estudio.id}
                    className={i < items.length - 1 ? "border-b border-hairline" : ""}
                  >
                    <td className="px-4 py-3 font-mono text-concrete">{estudio.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={estudio.estado} />
                    </td>
                    <td className="px-4 py-3 text-concrete">
                      {reporte ? reporte.estado : "No generado"}
                    </td>
                    <td className="px-4 py-3 text-concrete">
                      {reporte ? reporte.nivel_riesgo : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({ to: "/reportes/$estudioId", params: { estudioId: estudio.id } })
                        }
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
    </div>
  );
}
