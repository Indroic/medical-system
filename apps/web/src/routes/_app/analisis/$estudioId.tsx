import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import MriViewer from "@/components/mri-viewer";
import PageHeader from "@/components/page-header";
import RiesgoBadge from "@/components/riesgo-badge";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, analisisApi, estudiosApi } from "@/lib/python-api";
import type { AnalisisResponse, EstudioResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/analisis/$estudioId")({
  component: AnalisisDetail,
});

function AnalisisDetail() {
  const { estudioId } = Route.useParams();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [analisis, setAnalisis] = useState<AnalisisResponse | null>(null);
  const [estudio, setEstudio] = useState<EstudioResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      analisisApi.obtener(token, estudioId),
      estudiosApi.obtener(token, estudioId),
    ])
      .then(([a, e]) => {
        setAnalisis(a);
        setEstudio(e);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Error cargando análisis"))
      .finally(() => setLoading(false));
  }, [token, estudioId]);

  if (loading) {
    return <div className="p-8 text-[13px] text-concrete">Cargando análisis…</div>;
  }

  if (!analisis) {
    return <div className="p-8 text-[13px] text-concrete">Análisis no encontrado.</div>;
  }

  const criticos = analisis.hallazgos.filter((h) => h.es_critico);
  const normales = analisis.hallazgos.filter((h) => !h.es_critico);

  return (
    <div className="p-8">
      <PageHeader
        title="Resultados del análisis"
        action={
          <div className="flex items-center gap-3">
            <RiesgoBadge nivel={analisis.nivel_riesgo} />
            <button
              type="button"
              onClick={() => navigate({ to: "/estudios/$estudioId", params: { estudioId } })}
              className="text-[13px] text-concrete hover:text-graphite transition-colors"
            >
              ← Estudio
            </button>
          </div>
        }
      />

      {/* Summary row */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-[14px] border border-hairline p-4">
          <p className="text-[12px] text-concrete mb-1">Nivel de riesgo</p>
          <RiesgoBadge nivel={analisis.nivel_riesgo} />
        </div>
        <div className="rounded-[14px] border border-hairline p-4">
          <p className="text-[12px] text-concrete mb-1">Hallazgos totales</p>
          <p className="text-[32px] font-semibold text-graphite leading-none">{analisis.total_hallazgos}</p>
        </div>
        <div className="rounded-[14px] border border-hairline p-4">
          <p className="text-[12px] text-concrete mb-1">Hallazgos críticos</p>
          <p className={`text-[32px] font-semibold leading-none ${criticos.length > 0 ? "text-graphite" : "text-ash"}`}>
            {criticos.length}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[auto_1fr] gap-6 items-start">
        {/* CT viewer */}
        {estudio?.imagen_path && (
          <MriViewer imagePath={estudio.imagen_path} hallazgos={analisis.hallazgos} />
        )}

        {/* Findings table */}
        <div>
          {analisis.hallazgos.length === 0 ? (
            <div className="rounded-[14px] border border-hairline p-8 text-center text-[13px] text-concrete">
              No se encontraron hallazgos en esta resonancia magnética.
            </div>
          ) : (
            <div className="rounded-[14px] border border-hairline overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-hairline bg-mist">
                    <th className="px-4 py-3 text-left font-medium text-concrete">Etiqueta</th>
                    <th className="px-4 py-3 text-left font-medium text-concrete">Confianza</th>
                    <th className="px-4 py-3 text-left font-medium text-concrete">Crítico</th>
                    <th className="px-4 py-3 text-left font-medium text-concrete">Bbox</th>
                  </tr>
                </thead>
                <tbody>
                  {analisis.hallazgos.map((h, i) => (
                    <tr
                      key={i}
                      className={i < analisis.hallazgos.length - 1 ? "border-b border-hairline" : ""}
                    >
                      <td className="px-4 py-2.5 font-medium text-graphite">{h.etiqueta}</td>
                      <td className="px-4 py-2.5 font-mono text-concrete">
                        {(h.confianza * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5">
                        {h.es_critico ? (
                          <span className="inline-flex rounded-[26px] bg-carbon px-2 py-0.5 text-[11px] font-medium text-chalk">
                            Crítico
                          </span>
                        ) : (
                          <span className="text-concrete">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-concrete text-[11px]">
                        ({h.x_min.toFixed(0)},{h.y_min.toFixed(0)}) → ({h.x_max.toFixed(0)},{h.y_max.toFixed(0)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Report link */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate({ to: "/reportes/$estudioId", params: { estudioId } })}
              className="rounded-[10px] border border-hairline px-5 py-2.5 text-[13px] font-medium text-graphite hover:bg-mist transition-colors"
            >
              Ver reporte →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
