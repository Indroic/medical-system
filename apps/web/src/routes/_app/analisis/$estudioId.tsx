import { toast } from "@heroui/react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import MriViewer from "@/components/mri-viewer";
import PageHeader from "@/components/page-header";
import RiesgoBadge from "@/components/riesgo-badge";
import { ReportePDFDocument } from "@/components/reporte-pdf";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, analisisApi, estudiosApi, pacientesApi, reportesApi } from "@/lib/python-api";
import type { AnalisisResponse, EstudioResponse, PacienteResponse, ReporteResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/analisis/$estudioId")({
  component: AnalisisDetail,
});

function AnalisisDetail() {
  const { estudioId } = Route.useParams();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [analisis, setAnalisis] = useState<AnalisisResponse | null>(null);
  const [estudio, setEstudio] = useState<EstudioResponse | null>(null);
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null);
  const [reporte, setReporte] = useState<ReporteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const loadAll = async () => {
      try {
        const [a, e] = await Promise.all([
          analisisApi.obtener(token, estudioId),
          estudiosApi.obtener(token, estudioId)
        ]);
        setAnalisis(a);
        setEstudio(e);
        
        const [p, r] = await Promise.allSettled([
          pacientesApi.obtener(token, e.paciente_id),
          reportesApi.obtener(token, estudioId)
        ]);
        if (p.status === "fulfilled") setPaciente(p.value);
        if (r.status === "fulfilled") setReporte(r.value);
      } catch (err) {
        toast.danger("Error cargando análisis");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [token, estudioId]);

  if (loading) return <div className="p-8 text-muted">Cargando análisis…</div>;
  if (!analisis) return <div className="p-8 text-muted">Análisis no encontrado.</div>;

  const criticos = analisis.hallazgos.filter((h) => h.es_critico);

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Resultados del análisis"
        action={
          <div className="flex items-center gap-3">
            <RiesgoBadge nivel={analisis.nivel_riesgo} />
            <button
              type="button"
              onClick={() => navigate({ to: "/estudios/$estudioId", params: { estudioId } })}
              className="text-muted hover:text-ash transition-colors"
            >
              ← Estudio
            </button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[12px] text-muted mb-2">Nivel de riesgo</p>
          <RiesgoBadge nivel={analisis.nivel_riesgo} />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[12px] text-muted mb-2">Hallazgos totales</p>
          <p className="text-[32px] font-normal text-foreground leading-none">{analisis.total_hallazgos}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[12px] text-muted mb-2">Hallazgos críticos</p>
          <p className={`text-[32px] font-normal leading-none ${criticos.length > 0 ? "text-accent" : "text-graphite"}`}>
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
            <div className="rounded-2xl border border-border p-8 text-center text-[14px] text-muted bg-background">
              No se encontraron hallazgos patológicos en esta resonancia magnética.
            </div>
          ) : analisis.informe_avanzado_ia ? (
            <div className="rounded-2xl border border-accent/30 bg-background p-6 shadow-lg overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
              <h3 className="text-[16px] text-accent flex items-center gap-2 font-medium mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(128,82,255,0.6)]" />
                Informe Clínico de IA
              </h3>
              <div className="prose prose-invert prose-sm max-w-none text-ash font-sans prose-headings:text-foreground prose-a:text-link">
                <ReactMarkdown>{analisis.informe_avanzado_ia}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border p-8 text-center text-[14px] text-muted bg-background flex items-center justify-center gap-3">
              <span className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
              Generando informe clínico...
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {paciente && estudio && analisis ? (
              <PDFDownloadLink
                document={
                  <ReportePDFDocument
                    paciente={paciente}
                    estudio={estudio}
                    analisis={analisis}
                  />
                }
                fileName={`reporte_${estudioId}.pdf`}
                className="rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-[14px] font-medium hover:bg-accent-hover transition-colors text-center w-full sm:w-auto inline-block"
              >
                {({ loading: pdfLoading }) =>
                  pdfLoading ? "Preparando PDF…" : "Descargar reporte PDF"
                }
              </PDFDownloadLink>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-full border border-border/50 px-5 py-2.5 text-[14px] text-muted cursor-not-allowed transition-colors text-center w-full sm:w-auto"
              >
                Cargando datos del PDF…
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
