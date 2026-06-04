import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import EstadoBadge from "@/components/estado-badge";
import PageHeader from "@/components/page-header";
import PatientCard from "@/components/patient-card";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, estudiosApi, pacientesApi } from "@/lib/python-api";
import type { EstudioResponse, PacienteResponse } from "@/lib/python-api";

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

  useEffect(() => {
    if (!token) return;
    Promise.all([
      pacientesApi.obtener(token, pacienteId),
      estudiosApi.listar(token),
    ])
      .then(([p, e]) => {
        setPaciente(p);
        setEstudios(e.items.filter((est) => est.paciente_id === pacienteId));
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Error cargando paciente"))
      .finally(() => setLoading(false));
  }, [token, pacienteId]);

  if (loading) {
    return (
      <div className="p-8 text-[13px] text-concrete">Cargando…</div>
    );
  }

  if (!paciente) {
    return (
      <div className="p-8 text-[13px] text-concrete">Paciente no encontrado.</div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title={`${paciente.nombre} ${paciente.apellido}`}
        action={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/estudios/nuevo",
                  search: { pacienteId },
                })
              }
              className="rounded-[10px] bg-graphite px-4 py-2 text-[13px] font-medium text-chalk hover:bg-carbon transition-colors"
            >
              Nuevo estudio
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/pacientes" })}
              className="text-[13px] text-concrete hover:text-graphite transition-colors"
            >
              ← Volver
            </button>
          </div>
        }
      />

      {/* Patient info */}
      <div className="mt-6 max-w-lg">
        <PatientCard paciente={paciente} />
      </div>

      {/* Studies */}
      <div className="mt-8">
        <h2 className="text-[14px] font-semibold text-graphite mb-4">
          Estudios ({estudios.length})
        </h2>

        {estudios.length === 0 ? (
          <div className="rounded-[14px] border border-hairline p-8 text-center text-[13px] text-concrete">
            Este paciente no tiene estudios aún.
          </div>
        ) : (
          <div className="rounded-[14px] border border-hairline overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-hairline bg-mist">
                  <th className="px-4 py-3 text-left font-medium text-concrete">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium text-concrete">Acción</th>
                </tr>
              </thead>
              <tbody>
                {estudios.map((e, i) => (
                  <tr key={e.id} className={i < estudios.length - 1 ? "border-b border-hairline" : ""}>
                    <td className="px-4 py-3 font-mono text-concrete">{e.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={e.estado} />
                    </td>
                    <td className="px-4 py-3 text-concrete">{e.mime_type}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({ to: "/estudios/$estudioId", params: { estudioId: e.id } })
                        }
                        className="text-graphite font-medium hover:underline"
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
    </div>
  );
}
