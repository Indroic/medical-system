import { useEffect, useState } from "react";
import { Modal, toast } from "@heroui/react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useNavigate } from "@tanstack/react-router";

import EstadoBadge from "@/components/estado-badge";
import PatientCard from "@/components/patient-card";
import { ReportePDFDocument } from "@/components/reporte-pdf";
import { useAuthStore } from "@/lib/auth-store";
import { useImgproxyUrl } from "@/lib/imgproxy";
import { ApiError, analisisApi, estudiosApi, pacientesApi, reportesApi } from "@/lib/python-api";
import type { EstudioResponse, PacienteResponse, ReporteResponse, AnalisisResponse } from "@/lib/python-api";

interface EstudioDetailModalProps {
  state: any;
  estudioId: string | null;
}

export default function EstudioDetailModal({ state, estudioId }: EstudioDetailModalProps) {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [estudio, setEstudio] = useState<EstudioResponse | null>(null);
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null);
  const [reporte, setReporte] = useState<ReporteResponse | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const proxySrc = useImgproxyUrl(estudio?.imagenes_paths?.[0], 1000, 1000);

  useEffect(() => {
    if (!state.isOpen || !token || !estudioId) return;

    setLoading(true);

    const loadData = async () => {
      try {
        const e = await estudiosApi.obtener(token, estudioId);
        setEstudio(e);

        const promises: Promise<any>[] = [pacientesApi.obtener(token, e.paciente_id)];
        if (e.estado === "COMPLETADO") {
          promises.push(reportesApi.obtener(token, estudioId));
          promises.push(analisisApi.obtener(token, estudioId));
        }

        const results = await Promise.allSettled(promises);
        if (results[0].status === "fulfilled") setPaciente(results[0].value);
        if (e.estado === "COMPLETADO") {
          if (results[1] && results[1].status === "fulfilled") setReporte(results[1].value);
          if (results[2] && results[2].status === "fulfilled") setAnalisis(results[2].value);
        }
      } catch (error) {
        console.error("Error al cargar datos del estudio", error);
        toast.danger("Error cargando detalles del estudio");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Reemplazar polling por Server-Sent Events (SSE)
    const baseUrl = import.meta.env.VITE_SERVER_URL.replace(/\/$/, '');
    const sseUrl = `${baseUrl}/api/v1/events/${estudioId}`;
    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.addEventListener("ANALISIS_COMPLETADO", () => {
      toast.success("Análisis completado. Generando reporte...");
      loadData();
    });

    eventSource.addEventListener("REPORTE_LISTO", () => {
      toast.success("¡Reporte listo para descargar!");
      loadData();
    });

    eventSource.onerror = () => {
      console.error("Error en conexión SSE");
    };

    return () => {
      eventSource.close();
      setEstudio(null);
      setPaciente(null);
      setReporte(null);
    };
  }, [state.isOpen, token, estudioId]);

  const handleAnalizar = async () => {
    if (!token || !estudio) return;
    setAnalyzing(true);
    try {
      await analisisApi.ejecutar(token, estudio.id, estudio.imagenes_paths);
      state.close();
      navigate({ to: "/analisis/$estudioId", params: { estudioId: estudio.id } });
    } catch (err) {
      toast.danger(err instanceof ApiError ? err.message : "Error al iniciar análisis");
    } finally {
      setAnalyzing(false);
    }
  };

  const isPendiente = estudio?.estado === "PENDIENTE";
  const hasAnalisis = estudio?.estado !== "PENDIENTE";

  return (
    <Modal>
      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
        <Modal.Container>
          <Modal.Dialog className="bg-obsidian border border-charcoal w-full h-full max-w-full m-0 rounded-none sm:rounded-none">
            <Modal.Header className="flex flex-col gap-1 border-b border-charcoal text-snow px-8 py-6">
              <div className="flex items-center justify-between w-full">
                <Modal.Heading className="text-[20px] font-medium text-snow">Detalle de estudio</Modal.Heading>
                <div className="flex items-center gap-6">
                  {estudio && <EstadoBadge estado={estudio.estado} />}
                  <button
                    type="button"
                    onClick={state.close}
                    className="text-[13px] text-smoke hover:text-silver transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </Modal.Header>
            <Modal.Body className="p-8 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="text-[13px] text-smoke">Cargando…</div>
              ) : !estudio ? (
                <div className="text-[13px] text-smoke">Estudio no encontrado.</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
                  {/* Left: image */}
                  <div>
                    <div className="rounded-2xl border border-charcoal overflow-hidden bg-ash flex items-center justify-center min-h-[400px]">
                      {proxySrc ? (
                        <img
                          src={proxySrc}
                          alt="Resonancia Magnética"
                          className="max-h-[60vh] w-auto object-contain"
                        />
                      ) : (
                        <p className="text-[13px] text-smoke">Sin imagen disponible</p>
                      )}
                    </div>

                    <div className="mt-6 flex gap-4">
                      {isPendiente && (
                        <button
                          type="button"
                          onClick={handleAnalizar}
                          disabled={analyzing}
                          className="rounded-full bg-green px-6 py-2.5 text-[14px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors"
                        >
                          {analyzing ? "Analizando…" : "Ejecutar análisis IA"}
                        </button>
                      )}
                      {hasAnalisis && (
                        <button
                          type="button"
                          onClick={() => {
                            state.close();
                            navigate({ to: "/analisis/$estudioId", params: { estudioId: estudio.id } });
                          }}
                          className="rounded-full border border-charcoal px-6 py-2.5 text-[14px] text-snow hover:bg-ash hover:border-slate transition-colors"
                        >
                          Ver resultados de análisis →
                        </button>
                      )}
                      {reporte?.estado === "LISTO" && paciente && estudio && analisis ? (
                        <PDFDownloadLink
                          document={
                            <ReportePDFDocument
                              paciente={paciente}
                              estudio={estudio}
                              analisis={analisis}
                            />
                          }
                          fileName={`reporte_${estudioId}.pdf`}
                          className="rounded-full border border-charcoal px-6 py-2.5 text-[14px] text-snow hover:bg-ash hover:border-slate transition-colors text-center inline-block"
                        >
                          {({ loading: pdfLoading }) =>
                            pdfLoading ? "Preparando PDF…" : "Descargar reporte PDF"
                          }
                        </PDFDownloadLink>
                      ) : (
                        reporte?.estado === "LISTO" && (
                          <button
                            type="button"
                            disabled
                            className="rounded-full border border-charcoal/50 px-6 py-2.5 text-[14px] text-smoke cursor-not-allowed transition-colors"
                          >
                            Cargando datos del PDF…
                          </button>
                        )
                      )}
                  </div>
                </div>

                  {/* Right: info panel */}
                  <div className="flex flex-col gap-6">
                    {paciente && <PatientCard paciente={paciente} />}

                    <div className="rounded-2xl border border-charcoal bg-ash p-5">
                      <p className="text-[11px] font-medium text-smoke uppercase tracking-widest mb-4">
                        Detalles del estudio
                      </p>
                      <dl className="flex flex-col gap-3">
                        <Row label="ID" value={estudio.id.slice(0, 12) + "…"} mono />
                        <Row label="Tipo de imagen" value={estudio.mime_type} />
                        <Row label="Estado" value={<EstadoBadge estado={estudio.estado} />} />
                        {reporte && (
                          <Row
                            label="Reporte PDF"
                            value={
                              reporte.estado === "LISTO" ? <span className="text-green">Disponible</span>
                              : reporte.estado === "GENERANDO" ? "Generando…"
                              : "Error"
                            }
                          />
                        )}
                      </dl>
                    </div>
                  </div>
                </div>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[12px] text-smoke shrink-0">{label}</dt>
      <dd className={`text-[13px] text-silver text-right ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
