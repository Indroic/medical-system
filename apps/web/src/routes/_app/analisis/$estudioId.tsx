import { toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

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

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-8 items-start">
        {estudio?.imagenes_paths && estudio.imagenes_paths.length > 0 && (
          <MriViewer imagePaths={estudio.imagenes_paths} hallazgos={analisis.hallazgos} />
        )}

        <div>
          {analisis.hallazgos.length === 0 ? (
            <div className="rounded-2xl border border-charcoal p-8 text-center text-[14px] text-smoke bg-obsidian">
              No se encontraron hallazgos patológicos en esta resonancia magnética.
            </div>
          ) : analisis.informe_avanzado_ia ? (
            <div className="rounded-2xl border border-green/30 bg-obsidian p-6 shadow-lg overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
              <h3 className="text-[16px] text-green mb-4 flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-green animate-pulse shadow-[0_0_8px_rgba(62,207,142,0.6)]" />
                Informe Clínico de IA
              </h3>
              <div className="prose prose-invert prose-sm max-w-none text-silver font-sans prose-headings:text-snow prose-a:text-green">
                <ReactMarkdown>{analisis.informe_avanzado_ia}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-charcoal p-8 text-center text-[14px] text-smoke bg-obsidian flex items-center justify-center gap-3">
              <span className="w-4 h-4 border-2 border-smoke border-t-transparent rounded-full animate-spin" />
              Generando informe clínico...
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate({ to: "/reportes" })}
              className="rounded-full border border-charcoal px-5 py-2 text-[13px] text-snow hover:bg-ash hover:border-slate transition-colors"
            >
              Ver reportes PDF →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
