import { toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import RiesgoBadge from "@/components/riesgo-badge";
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
      .catch((err) => toast.danger("Error cargando reportes"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-8">
      <PageHeader title="Reportes" subtitle="Estudios completados con reportes generados" />

      <div className="mt-8">
        {loading ? (
          <div className="rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke">
            Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-charcoal p-12 text-center">
            <p className="text-[14px] text-snow mb-2">Sin reportes disponibles</p>
            <p className="text-[13px] text-smoke">
              Los reportes aparecen aquí una vez completado el análisis de un estudio.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-charcoal overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-charcoal bg-ash">
                  <th className="px-4 py-3 text-left text-smoke font-normal">Estudio</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Estado estudio</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Estado reporte</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Nivel riesgo</th>
                  <th className="px-4 py-3 text-right text-smoke font-normal">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ estudio, reporte }, i) => (
                  <tr key={estudio.id} className={i < items.length - 1 ? "border-b border-charcoal" : ""}>
                    <td className="px-4 py-3 font-mono text-smoke">{estudio.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3"><EstadoBadge estado={estudio.estado} /></td>
                    <td className="px-4 py-3 text-smoke">{reporte ? reporte.estado : "No generado"}</td>
                    <td className="px-4 py-3">
                      {reporte ? <RiesgoBadge nivel={reporte.nivel_riesgo} /> : <span className="text-smoke">—</span>}
                    </td>
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
    </div>
  );
}
