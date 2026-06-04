import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import PatientCard from "@/components/patient-card";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, analisisApi, estudiosApi, pacientesApi, reportesApi } from "@/lib/python-api";
import type { EstudioResponse, PacienteResponse, ReporteResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/estudios/$estudioId")({
  component: EstudioDetail,
});

function EstudioDetail() {
  const { estudioId } = Route.useParams();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [estudio, setEstudio] = useState<EstudioResponse | null>(null);
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null);
  const [reporte, setReporte] = useState<ReporteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!token) return;
    estudiosApi
      .obtener(token, estudioId)
      .then(async (e) => {
        setEstudio(e);
        const [p, r] = await Promise.allSettled([
          pacientesApi.obtener(token, e.paciente_id),
          reportesApi.obtener(token, estudioId),
        ]);
        if (p.status === "fulfilled") setPaciente(p.value);
        if (r.status === "fulfilled") setReporte(r.value);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Error cargando estudio"))
      .finally(() => setLoading(false));
  }, [token, estudioId]);

  const handleAnalizar = async () => {
    if (!token || !estudio) return;
    setAnalyzing(true);
    try {
      await analisisApi.ejecutar(token, estudio.id, estudio.imagen_path);
      toast.success("Análisis iniciado");
      navigate({ to: "/analisis/$estudioId", params: { estudioId } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al iniciar análisis");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-[13px] text-concrete">Cargando…</div>;
  }

  if (!estudio) {
    return <div className="p-8 text-[13px] text-concrete">Estudio no encontrado.</div>;
  }

  const isPendiente = estudio.estado === "PENDIENTE";
  const hasAnalisis = estudio.estado !== "PENDIENTE";

  return (
    <div className="p-8">
      <PageHeader
        title="Detalle de estudio"
        action={
          <div className="flex items-center gap-3">
            <EstadoBadge estado={estudio.estado} />
            <button
              type="button"
              onClick={() => navigate({ to: "/estudios" })}
              className="text-[13px] text-concrete hover:text-graphite transition-colors"
            >
              ← Volver
            </button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-[1fr_320px] gap-6">
        {/* Left: image */}
        <div>
          <div className="rounded-[14px] border border-hairline overflow-hidden bg-mist flex items-center justify-center min-h-[320px]">
            {estudio.imagen_path ? (
              <img
                src={estudio.imagen_path}
                alt="Tomografía"
                className="max-h-[480px] w-auto object-contain"
              />
            ) : (
              <p className="text-[13px] text-concrete">Sin imagen disponible</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            {isPendiente && (
              <button
                type="button"
                onClick={handleAnalizar}
                disabled={analyzing}
                className="rounded-[10px] bg-graphite px-5 py-2.5 text-[14px] font-medium text-chalk hover:bg-carbon disabled:opacity-50 transition-colors"
              >
                {analyzing ? "Analizando…" : "Ejecutar análisis IA"}
              </button>
            )}
            {hasAnalisis && (
              <button
                type="button"
                onClick={() => navigate({ to: "/analisis/$estudioId", params: { estudioId } })}
                className="rounded-[10px] border border-hairline px-5 py-2.5 text-[14px] font-medium text-graphite hover:bg-mist transition-colors"
              >
                Ver análisis →
              </button>
            )}
            {reporte?.estado === "LISTO" && (
              <a
                href={`${import.meta.env.VITE_PYTHON_API_URL}/api/v1/reportes/${estudioId}/descargar`}
                download
                className="rounded-[10px] border border-hairline px-5 py-2.5 text-[14px] font-medium text-graphite hover:bg-mist transition-colors"
              >
                Descargar PDF
              </a>
            )}
          </div>
        </div>

        {/* Right: info panel */}
        <div className="flex flex-col gap-4">
          {paciente && <PatientCard paciente={paciente} />}

          <div className="rounded-[14px] border border-hairline bg-chalk p-4">
            <p className="text-[12px] font-medium text-concrete uppercase tracking-wide mb-3">
              Detalles del estudio
            </p>
            <dl className="flex flex-col gap-2">
              <Row label="ID" value={estudio.id.slice(0, 12) + "…"} mono />
              <Row label="Tipo de imagen" value={estudio.mime_type} />
              <Row label="Estado" value={<EstadoBadge estado={estudio.estado} />} />
              {reporte && (
                <Row
                  label="Reporte"
                  value={
                    reporte.estado === "LISTO"
                      ? "Disponible"
                      : reporte.estado === "GENERANDO"
                      ? "Generando…"
                      : "Error"
                  }
                />
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[12px] text-concrete shrink-0">{label}</dt>
      <dd className={`text-[13px] text-graphite text-right ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
