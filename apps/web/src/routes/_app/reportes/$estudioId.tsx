import { toast } from "@heroui/react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import PageHeader from "@/components/page-header";
import RiesgoBadge from "@/components/riesgo-badge";
import { ReportePDFDocument } from "@/components/reporte-pdf";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, reportesApi, estudiosApi, pacientesApi, analisisApi } from "@/lib/python-api";
import type { ReporteResponse, EstudioResponse, PacienteResponse, AnalisisResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/reportes/$estudioId")({
  component: ReportePage,
});

function ReportePage() {
  const { estudioId } = Route.useParams();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [reporte, setReporte] = useState<ReporteResponse | null>(null);
  const [estudio, setEstudio] = useState<EstudioResponse | null>(null);
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfDataLoading, setPdfDataLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReporte = async () => {
    if (!token) return;
    try {
      const r = await reportesApi.obtener(token, estudioId);
      setReporte(r);
      
      if (r.estado === "LISTO" || r.estado === "FALLIDO") {
        if (pollingRef.current) clearInterval(pollingRef.current);
        
        // Si el reporte está listo y aún no tenemos los datos detallados, los cargamos
        if (r.estado === "LISTO" && !paciente) {
          setPdfDataLoading(true);
          try {
            const [est, ana] = await Promise.all([
              estudiosApi.obtener(token, estudioId),
              analisisApi.obtener(token, estudioId),
            ]);
            setEstudio(est);
            setAnalisis(ana);
            
            const pac = await pacientesApi.obtener(token, est.paciente_id);
            setPaciente(pac);
          } catch (err) {
            console.error("Error al cargar datos adicionales del reporte", err);
            toast.danger("Error al preparar los datos del reporte PDF");
          } finally {
            setPdfDataLoading(false);
          }
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setReporte(null);
      }
      if (pollingRef.current) clearInterval(pollingRef.current);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
    pollingRef.current = setInterval(fetchReporte, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [token, estudioId]);

  return (
    <div className="p-8">
      <PageHeader
        title="Reporte clínico"
        action={
          <button
            type="button"
            onClick={() => navigate({ to: "/analisis/$estudioId", params: { estudioId } })}
            className="text-[13px] text-smoke hover:text-silver transition-colors"
          >
            ← Análisis
          </button>
        }
      />

      <div className="mt-6 max-w-lg">
        {loading ? (
          <div className="rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke">
            Cargando reporte…
          </div>
        ) : !reporte ? (
          <div className="rounded-2xl border border-charcoal p-8 text-center">
            <p className="text-[14px] text-snow mb-2">Reporte no disponible</p>
            <p className="text-[13px] text-smoke">
              El reporte se genera automáticamente tras completar el análisis.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-charcoal bg-ash p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] text-silver">Estado del reporte</p>
                <StatusIndicator estado={reporte.estado} />
              </div>

              <dl className="flex flex-col gap-3">
                <Row label="ID del reporte" value={reporte.reporte_id.slice(0, 12) + "…"} mono />
                <Row label="Nivel de riesgo" value={<RiesgoBadge nivel={reporte.nivel_riesgo} />} />
                <Row label="Hallazgos" value={String(reporte.total_hallazgos)} />
                <Row label="PDF disponible" value={reporte.pdf_disponible ? "Sí" : "No"} />
              </dl>
            </div>

            {reporte.estado === "LISTO" && paciente && estudio && analisis ? (
              <PDFDownloadLink
                document={
                  <ReportePDFDocument
                    paciente={paciente}
                    estudio={estudio}
                    analisis={analisis}
                  />
                }
                fileName={`reporte_${estudioId}.pdf`}
                className="w-full text-center block rounded-full bg-green py-2.5 text-[14px] font-medium text-obsidian hover:bg-green-deep transition-colors"
              >
                {({ loading: pdfLoading }) =>
                  pdfLoading ? "Preparando PDF…" : "Descargar reporte PDF"
                }
              </PDFDownloadLink>
            ) : (
              <button
                type="button"
                disabled
                className="w-full rounded-full bg-green py-2.5 text-[14px] font-medium text-obsidian disabled:opacity-40 transition-colors"
              >
                {reporte.estado === "GENERANDO"
                  ? "Generando PDF…"
                  : reporte.estado === "FALLIDO"
                  ? "Error al generar"
                  : pdfDataLoading
                  ? "Cargando datos de reporte…"
                  : "Descargar reporte PDF"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIndicator({ estado }: { estado: string }) {
  if (estado === "GENERANDO") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-charcoal bg-ash px-3 py-1 text-[12px] text-smoke">
        <span className="h-1.5 w-1.5 rounded-full bg-smoke animate-pulse" />
        Generando
      </span>
    );
  }
  if (estado === "LISTO") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 border border-green/30 px-3 py-1 text-[12px] font-medium text-green">
        <span className="h-1.5 w-1.5 rounded-full bg-green" />
        Listo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-charcoal bg-ash px-3 py-1 text-[12px] text-smoke">
      Error
    </span>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[12px] text-smoke">{label}</dt>
      <dd className={`text-[13px] text-silver ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
