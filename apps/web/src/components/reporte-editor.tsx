import { toast } from "@heroui/react";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

import EstadoBadge from "@/components/estado-badge";
import RiesgoBadge from "@/components/riesgo-badge";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, reportesApi } from "@/lib/python-api";
import type { ReporteResponse } from "@/lib/python-api";

const NIVELES = ["BAJO", "MODERADO", "CRITICO", "NO_EVALUADO"] as const;

interface Props {
  reporte: ReporteResponse;
  /** Se llama con el reporte actualizado tras guardar o aprobar. */
  onUpdated?: (reporte: ReporteResponse) => void;
}

/**
 * Edición de un reporte médico mientras está pendiente (§3.1).
 *
 * La regla de si admite cambios la decide el backend vía `reporte.editable`;
 * aquí no se replica la lista de estados editables. Una vez aprobado, el
 * formulario se sustituye por el detalle en modo lectura.
 */
export default function ReporteEditor({ reporte, onUpdated }: Props) {
  const { token } = useAuthStore();
  const [observaciones, setObservaciones] = useState(reporte.observaciones ?? "");
  const [nivelRiesgo, setNivelRiesgo] = useState(reporte.nivel_riesgo);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  // Resincronizar si el reporte llega actualizado desde fuera (SSE, recarga).
  useEffect(() => {
    setObservaciones(reporte.observaciones ?? "");
    setNivelRiesgo(reporte.nivel_riesgo);
  }, [reporte.reporte_id, reporte.observaciones, reporte.nivel_riesgo]);

  const sinCambios =
    observaciones === (reporte.observaciones ?? "") && nivelRiesgo === reporte.nivel_riesgo;

  const handleGuardar = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const actualizado = await reportesApi.actualizar(token, reporte.estudio_id, {
        observaciones,
        nivel_riesgo: nivelRiesgo,
      });
      toast.success("Reporte actualizado");
      onUpdated?.(actualizado);
    } catch (err) {
      toast.danger(
        err instanceof ApiError ? err.message : "No se pudo actualizar el reporte",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAprobar = async () => {
    if (!token) return;
    setApproving(true);
    try {
      const actualizado = await reportesApi.aprobar(token, reporte.estudio_id);
      toast.success("Reporte aprobado. Ya no admite cambios.");
      onUpdated?.(actualizado);
    } catch (err) {
      toast.danger(err instanceof ApiError ? err.message : "No se pudo aprobar el reporte");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="rounded-cards bg-surface shadow-surface p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] font-medium text-accent uppercase tracking-widest">
          Reporte médico
        </p>
        <EstadoBadge estado={reporte.estado} />
      </div>

      {reporte.editable ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reporte-nivel-riesgo"
              className="text-[12px] text-muted"
            >
              Nivel de riesgo
            </label>
            <select
              id="reporte-nivel-riesgo"
              value={nivelRiesgo}
              onChange={(e) => setNivelRiesgo(e.target.value)}
              className="rounded-nav border border-field-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-accent transition-colors"
            >
              {NIVELES.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {nivel === "NO_EVALUADO" ? "No evaluado" : `Riesgo ${nivel.toLowerCase()}`}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted">
              Corrige la evaluación automática de la IA si procede.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reporte-observaciones" className="text-[12px] text-muted">
              Observaciones clínicas
            </label>
            <textarea
              id="reporte-observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={5}
              maxLength={8000}
              placeholder="Complementa el informe con tus hallazgos, contexto clínico o recomendaciones…"
              className="rounded-nav border border-field-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted resize-y focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-[11px] text-muted">{observaciones.length}/8000</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving || sinCambios}
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={handleAprobar}
              disabled={approving}
              className="rounded-full border border-border px-4 py-2 text-[13px] text-foreground hover:bg-surface-hover hover:border-field-border disabled:opacity-50 transition-colors"
            >
              {approving ? "Aprobando…" : "Aprobar y bloquear"}
            </button>
          </div>
          <p className="text-[11px] text-muted">
            Al aprobar, el reporte queda inmutable para preservar la trazabilidad.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <Lock size={13} aria-hidden="true" />
            <span>Reporte aprobado: la edición está bloqueada.</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[12px] text-muted">Nivel de riesgo</span>
            <RiesgoBadge nivel={reporte.nivel_riesgo} />
          </div>

          {reporte.aprobado_en && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-[12px] text-muted shrink-0">Aprobado</span>
              <span className="text-[13px] text-muted text-right">
                {new Date(reporte.aprobado_en).toLocaleString("es", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          <div>
            <p className="text-[12px] text-muted mb-1">Observaciones clínicas</p>
            <p className="text-[13px] text-foreground whitespace-pre-wrap">
              {reporte.observaciones?.trim() || "Sin observaciones."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
