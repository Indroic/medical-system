import { toast } from "@heroui/react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import MriViewer from "@/components/mri-viewer";
import PageHeader from "@/components/page-header";
import RiesgoBadge from "@/components/riesgo-badge";
import ReporteEditor from "@/components/reporte-editor";
import { ReportePDFDocument } from "@/components/reporte-pdf";
import { useImagenesAnotadas } from "@/lib/anotar-imagen";
import { useAuthStore } from "@/lib/auth-store";
import { filtrarConfiables } from "@/lib/hallazgos";
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

  // Cortes con los bboxes y etiquetas quemados en el píxel, para el PDF.
  const { imagenes: imagenesAnotadas, cargando: anotando } = useImagenesAnotadas(
    estudio?.imagenes_paths,
    analisis?.hallazgos,
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadAll = async (mostrarLoading: boolean) => {
      if (mostrarLoading) setLoading(true);
      try {
        const [a, e] = await Promise.all([
          analisisApi.obtener(token, estudioId),
          estudiosApi.obtener(token, estudioId)
        ]);
        if (cancelled) return;
        setAnalisis(a);
        setEstudio(e);

        const [p, r] = await Promise.allSettled([
          pacientesApi.obtener(token, e.paciente_id),
          reportesApi.obtener(token, estudioId)
        ]);
        if (cancelled) return;
        if (p.status === "fulfilled") setPaciente(p.value);
        if (r.status === "fulfilled") setReporte(r.value);
      } catch (err) {
        if (mostrarLoading) toast.danger("Error cargando análisis");
      } finally {
        if (mostrarLoading) setLoading(false);
      }
    };
    loadAll(true);

    // Mientras el análisis siga en curso, esta página se refresca sola en
    // cuanto el backend termina (mismo patrón SSE que estudios/$estudioId).
    const baseUrl = (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
    const eventSource = new EventSource(`${baseUrl}/api/events/${estudioId}`, {
      withCredentials: true,
    });
    eventSource.addEventListener("ANALISIS_COMPLETADO", () => {
      toast.success("Análisis completado");
      loadAll(false);
    });
    eventSource.onerror = () => {
      console.error("Error en conexión SSE");
    };

    return () => {
      cancelled = true;
      eventSource.close();
    };
  }, [token, estudioId]);

  if (loading) return <div className="p-8 text-muted">Cargando análisis…</div>;
  if (!analisis) return <div className="p-8 text-muted">Análisis no encontrado.</div>;

  const volverAEstudio = () => navigate({ to: "/estudios/$estudioId", params: { estudioId } });

  // Mientras el estudio siga EN_ANALISIS, los hallazgos/nivel_riesgo del
  // análisis todavía son valores por defecto (no hay resultados reales aún):
  // mostrar el estado real en vez de una tarjeta de "sin hallazgos" engañosa.
  if (estudio?.estado === "EN_ANALISIS") {
    return (
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Resultados del análisis"
          action={
            <button type="button" onClick={volverAEstudio} className="text-muted hover:text-foreground transition-colors">
              ← Estudio
            </button>
          }
        />
        <div className="mt-8 rounded-cards bg-surface shadow-surface p-12 flex flex-col items-center justify-center gap-4 text-center">
          <span className="w-8 h-8 border-[3px] border-muted border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <p className="text-[14px] text-foreground">El análisis todavía está en curso…</p>
          <p className="text-[13px] text-muted max-w-sm">
            Esta página se actualizará automáticamente en cuanto termine. Puede tardar unos minutos.
          </p>
        </div>
      </div>
    );
  }

  if (estudio?.estado === "FALLIDO") {
    return (
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Resultados del análisis"
          action={
            <button type="button" onClick={volverAEstudio} className="text-muted hover:text-foreground transition-colors">
              ← Estudio
            </button>
          }
        />
        <div className="mt-8 rounded-cards bg-danger-soft p-8 text-center text-[14px] text-danger-soft-foreground">
          El análisis falló y no se pudo completar. Vuelve al estudio para reintentarlo.
        </div>
      </div>
    );
  }

  // Sólo cuentan las etiquetas por encima del umbral de confianza.
  const hallazgos = filtrarConfiables(analisis.hallazgos);
  const criticos = hallazgos.filter((h) => h.es_critico);

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
              className="text-muted hover:text-foreground transition-colors"
            >
              ← Estudio
            </button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-cards bg-surface shadow-surface p-5">
          <p className="text-[12px] text-muted mb-2">Nivel de riesgo</p>
          <RiesgoBadge nivel={analisis.nivel_riesgo} />
        </div>
        <div className="rounded-cards bg-surface shadow-surface p-5">
          <p className="text-[12px] text-muted mb-2">Hallazgos totales</p>
          <p className="text-[32px] font-semibold text-foreground leading-none">{hallazgos.length}</p>
        </div>
        <div className="rounded-cards bg-surface shadow-surface p-5">
          <p className="text-[12px] text-muted mb-2">Hallazgos críticos</p>
          <p className={`text-[32px] font-semibold leading-none ${criticos.length > 0 ? "text-danger" : "text-foreground"}`}>
            {criticos.length}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-8 items-start">
        {estudio?.imagenes_paths && estudio.imagenes_paths.length > 0 && (
          <MriViewer imagePaths={estudio.imagenes_paths} hallazgos={analisis.hallazgos} />
        )}

        <div>
          {hallazgos.length === 0 ? (
            <div className="rounded-cards bg-success-soft p-8 text-center text-[14px] text-success-soft-foreground">
              No se encontraron hallazgos patológicos en esta resonancia magnética.
            </div>
          ) : analisis.informe_avanzado_ia ? (
            <div className="rounded-cards border border-accent/30 bg-surface p-6 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
              <h3 className="text-[16px] text-accent flex items-center gap-2 font-medium mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                Informe radiológico
              </h3>
              <div className="prose prose-sm max-w-none text-muted font-sans prose-headings:text-foreground prose-a:text-link">
                <ReactMarkdown>{analisis.informe_avanzado_ia}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="rounded-cards bg-surface shadow-surface p-8 text-center text-[14px] text-muted flex items-center justify-center gap-3">
              <span className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
              Generando informe clínico...
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {paciente && estudio && analisis && !anotando ? (
              <PDFDownloadLink
                document={
                  <ReportePDFDocument
                    paciente={paciente}
                    estudio={estudio}
                    analisis={analisis}
                    reporte={reporte}
                    imagenesAnotadas={imagenesAnotadas}
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
                {anotando ? "Preparando imágenes del reporte…" : "Cargando datos del PDF…"}
              </button>
            )}
          </div>

          {/* §3.1 — validar/complementar el reporte durante la revisión */}
          {reporte && (
            <div className="mt-6">
              <ReporteEditor reporte={reporte} onUpdated={setReporte} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
