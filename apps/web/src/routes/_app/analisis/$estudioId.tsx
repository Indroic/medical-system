import { toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
    Promise.all([analisisApi.obtener(token, estudioId), estudiosApi.obtener(token, estudioId)])
      .then(([a, e]) => { setAnalisis(a); setEstudio(e); })
      .catch((err) => toast.danger("Error cargando análisis"))
      .finally(() => setLoading(false));
  }, [token, estudioId]);

  if (loading) return <div className="p-8 text-[13px] text-smoke">Cargando análisis…</div>;
  if (!analisis) return <div className="p-8 text-[13px] text-smoke">Análisis no encontrado.</div>;

  const criticos = analisis.hallazgos.filter((h) => h.es_critico);

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
              className="text-[13px] text-smoke hover:text-silver transition-colors"
            >
              ← Estudio
            </button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-charcoal bg-ash p-5">
          <p className="text-[12px] text-smoke mb-2">Nivel de riesgo</p>
          <RiesgoBadge nivel={analisis.nivel_riesgo} />
        </div>
        <div className="rounded-2xl border border-charcoal bg-ash p-5">
          <p className="text-[12px] text-smoke mb-2">Hallazgos totales</p>
          <p className="text-[32px] font-normal text-snow leading-none">{analisis.total_hallazgos}</p>
        </div>
        <div className="rounded-2xl border border-charcoal bg-ash p-5">
          <p className="text-[12px] text-smoke mb-2">Hallazgos críticos</p>
          <p className={`text-[32px] font-normal leading-none ${criticos.length > 0 ? "text-green" : "text-graphite"}`}>
            {criticos.length}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[auto_1fr] gap-6 items-start">
        {estudio?.imagenes_paths && estudio.imagenes_paths.length > 0 && (
          <MriViewer imagePaths={estudio.imagenes_paths} hallazgos={analisis.hallazgos} />
        )}

        <div>
          {analisis.hallazgos.length === 0 ? (
            <div className="rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke">
              No se encontraron hallazgos en esta resonancia magnética.
            </div>
          ) : (
            <div className="rounded-2xl border border-charcoal overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-charcoal bg-ash">
                    <th className="px-4 py-3 text-left text-smoke font-normal">Corte</th>
                    <th className="px-4 py-3 text-left text-smoke font-normal">Etiqueta</th>
                    <th className="px-4 py-3 text-left text-smoke font-normal">Confianza</th>
                    <th className="px-4 py-3 text-left text-smoke font-normal">Crítico</th>
                    <th className="px-4 py-3 text-left text-smoke font-normal">BBox</th>
                  </tr>
                </thead>
                <tbody>
                  {analisis.hallazgos.map((h, i) => (
                    <tr key={i} className={i < analisis.hallazgos.length - 1 ? "border-b border-charcoal" : ""}>
                      <td className="px-4 py-2.5 text-silver">{h.image_index + 1}</td>
                      <td className="px-4 py-2.5 text-snow">{h.etiqueta}</td>
                      <td className="px-4 py-2.5 font-mono text-smoke">{(h.confianza * 100).toFixed(1)}%</td>
                      <td className="px-4 py-2.5">
                        {h.es_critico ? (
                          <span className="inline-flex rounded-full bg-green/10 border border-green/30 px-2 py-0.5 text-[11px] font-medium text-green">
                            Crítico
                          </span>
                        ) : (
                          <span className="text-smoke">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-smoke text-[11px]">
                        ({h.x_min.toFixed(0)},{h.y_min.toFixed(0)}) → ({h.x_max.toFixed(0)},{h.y_max.toFixed(0)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {analisis.informe_avanzado_ia && (
            <div className="mt-6 rounded-2xl border border-green/30 bg-green/5 p-6 shadow-sm">
              <h3 className="text-[14px] text-green mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
                Informe Clínico IA (Ollama)
              </h3>
              <div className="text-[13px] text-silver leading-relaxed whitespace-pre-wrap font-sans">
                {analisis.informe_avanzado_ia}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate({ to: "/reportes" })}
              className="rounded-full border border-charcoal px-5 py-2 text-[13px] text-snow hover:bg-ash hover:border-slate transition-colors"
            >
              Ver reporte →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
