import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import PageHeader from "@/components/page-header";
import RiesgoBadge from "@/components/riesgo-badge";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, reportesApi } from "@/lib/python-api";
import type { ReporteResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/reportes/$estudioId")({
  component: ReportePage,
});

function ReportePage() {
  const { estudioId } = Route.useParams();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [reporte, setReporte] = useState<ReporteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReporte = async () => {
    if (!token) return;
    try {
      const r = await reportesApi.obtener(token, estudioId);
      setReporte(r);
      if (r.estado === "LISTO" || r.estado === "FALLIDO") {
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setReporte(null);
      } else {
        toast.error("Error cargando reporte");
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

  const handleDownload = async () => {
    if (!token) return;
    try {
      const url = reportesApi.urlDescarga(estudioId);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("No se pudo descargar el PDF");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `reporte_${estudioId}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      toast.error("Error al descargar el reporte");
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Reporte clínico"
        action={
          <button
            type="button"
            onClick={() => navigate({ to: "/analisis/$estudioId", params: { estudioId } })}
            className="text-[13px] text-concrete hover:text-graphite transition-colors"
          >
            ← Análisis
          </button>
        }
      />

      <div className="mt-6 max-w-lg">
        {loading ? (
          <div className="rounded-[14px] border border-hairline p-8 text-center text-[13px] text-concrete">
            Cargando reporte…
          </div>
        ) : !reporte ? (
          <div className="rounded-[14px] border border-hairline p-8 text-center">
            <p className="text-[14px] font-medium text-graphite mb-2">Reporte no disponible</p>
            <p className="text-[13px] text-concrete">
              El reporte se genera automáticamente tras completar el análisis.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Status card */}
            <div className="rounded-[14px] border border-hairline bg-chalk p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold text-graphite">Estado del reporte</p>
                <StatusIndicator estado={reporte.estado} />
              </div>

              <dl className="flex flex-col gap-3">
                <Row label="ID del reporte" value={reporte.reporte_id.slice(0, 12) + "…"} mono />
                <Row label="Nivel de riesgo" value={<RiesgoBadge nivel={reporte.nivel_riesgo} />} />
                <Row label="Hallazgos" value={String(reporte.total_hallazgos)} />
                <Row
                  label="PDF disponible"
                  value={reporte.pdf_disponible ? "Sí" : "No"}
                />
              </dl>
            </div>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={reporte.estado !== "LISTO" || !reporte.pdf_disponible}
              className="w-full rounded-[10px] bg-graphite py-3 text-[14px] font-medium text-chalk hover:bg-carbon disabled:opacity-40 transition-colors"
            >
              {reporte.estado === "GENERANDO"
                ? "Generando PDF…"
                : reporte.estado === "FALLIDO"
                ? "Error al generar"
                : "Descargar reporte PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIndicator({ estado }: { estado: string }) {
  if (estado === "GENERANDO") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[26px] border border-hairline bg-mist px-3 py-1 text-[12px] font-medium text-concrete">
        <span className="h-1.5 w-1.5 rounded-full bg-concrete animate-pulse" />
        Generando
      </span>
    );
  }
  if (estado === "LISTO") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[26px] bg-graphite px-3 py-1 text-[12px] font-medium text-chalk">
        <span className="h-1.5 w-1.5 rounded-full bg-chalk" />
        Listo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[26px] border border-hairline bg-mist px-3 py-1 text-[12px] font-medium text-concrete">
      Error
    </span>
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
    <div className="flex items-center justify-between">
      <dt className="text-[12px] text-concrete">{label}</dt>
      <dd className={`text-[13px] text-graphite ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
