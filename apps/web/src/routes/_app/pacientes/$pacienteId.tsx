import { toast } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import PatientCard from "@/components/patient-card";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, estudiosApi, pacientesApi } from "@/lib/python-api";
import type { EstudioResponse, PacienteResponse } from "@/lib/python-api";
import { useOverlayState } from "@heroui/react";
import EstudioDetailModal from "@/components/estudio-detail-modal";
import NuevoEstudioModal from "@/components/nuevo-estudio-modal";

export const Route = createFileRoute("/_app/pacientes/$pacienteId")({
  component: PacienteDetail,
});

function PacienteDetail() {
  const { pacienteId } = Route.useParams();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null);
  const [estudios, setEstudios] = useState<EstudioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const state = useOverlayState({ defaultOpen: false });
  const detailModalState = useOverlayState({ defaultOpen: false });
  const [selectedEstudioId, setSelectedEstudioId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // El filtrado por paciente lo hace la API (?paciente_id=...): así se ve el
    // historial completo, incluidos los estudios subidos por otros médicos.
    Promise.all([
      pacientesApi.obtener(token, pacienteId),
      estudiosApi.listar(token, pacienteId),
    ])
      .then(([p, e]) => {
        setPaciente(p);
        setEstudios(e.items);
      })
      .catch(() => toast.danger("Error cargando paciente"))
      .finally(() => setLoading(false));
  }, [token, pacienteId]);

  if (loading) return <div className="p-8 text-[13px] text-muted">Cargando…</div>;
  if (!paciente) return <div className="p-8 text-[13px] text-muted">Paciente no encontrado.</div>;

  return (
    <div className="p-8">
      <PageHeader
        title={`${paciente.nombre} ${paciente.apellido}`}
        action={
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={state.open}
              className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground hover:bg-accent-hover transition-colors"
            >
              Nuevo estudio
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/pacientes" })}
              className="text-[13px] text-muted hover:text-foreground transition-colors"
            >
              ← Volver
            </button>
          </div>
        }
      />

      <div className="mt-6 max-w-lg">
        <PatientCard paciente={paciente} />
      </div>

      <div className="mt-8">
        <h2 className="text-[14px] text-muted mb-4">Estudios ({estudios.length})</h2>

        {estudios.length === 0 ? (
          <div className="rounded-cards bg-surface shadow-surface p-8 text-center text-[13px] text-muted">
            Este paciente no tiene estudios aún.
          </div>
        ) : (
          <div className="rounded-cards bg-surface shadow-surface overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="px-4 py-3 text-left text-muted font-normal">ID</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Estado</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Tipo</th>
                  <th className="px-4 py-3 text-right text-muted font-normal">Acción</th>
                </tr>
              </thead>
              <tbody>
                {estudios.map((e, i) => (
                  <tr key={e.id} className={i < estudios.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 font-mono text-muted">{e.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3"><EstadoBadge estado={e.estado} /></td>
                    <td className="px-4 py-3 text-muted">{e.mime_type}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEstudioId(e.id);
                          detailModalState.open();
                        }}
                        className="text-link font-medium hover:underline"
                      >
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NuevoEstudioModal state={state} prefilledPacienteId={pacienteId} />
      <EstudioDetailModal state={detailModalState} estudioId={selectedEstudioId} />
    </div>
  );
}
