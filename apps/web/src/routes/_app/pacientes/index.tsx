import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import PageHeader from "@/components/page-header";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, pacientesApi } from "@/lib/python-api";
import type { PacienteResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/pacientes/")({
  component: PacientesList,
});

function PacientesList() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    // The API doesn't have a list endpoint for patients yet.
    // We'll show an empty state and let users create from here.
    setLoading(false);
  }, [token]);

  return (
    <div className="p-8">
      <PageHeader
        title="Pacientes"
        action={
          <button
            type="button"
            onClick={() => navigate({ to: "/pacientes/nuevo" })}
            className="rounded-[10px] bg-graphite px-4 py-2 text-[13px] font-medium text-chalk hover:bg-carbon transition-colors"
          >
            Nuevo paciente
          </button>
        }
      />

      <div className="mt-8">
        {loading ? (
          <div className="rounded-[14px] border border-hairline p-8 text-center text-[13px] text-concrete">
            Cargando…
          </div>
        ) : pacientes.length === 0 ? (
          <div className="rounded-[14px] border border-hairline p-12 text-center">
            <p className="text-[14px] font-medium text-graphite mb-2">No hay pacientes registrados</p>
            <p className="text-[13px] text-concrete mb-6">
              Crea el primer paciente para comenzar a subir estudios.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/pacientes/nuevo" })}
              className="rounded-[10px] bg-graphite px-5 py-2.5 text-[14px] font-medium text-chalk hover:bg-carbon transition-colors"
            >
              Crear paciente
            </button>
          </div>
        ) : (
          <div className="rounded-[14px] border border-hairline overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-hairline bg-mist">
                  <th className="px-4 py-3 text-left font-medium text-concrete">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Documento</th>
                  <th className="px-4 py-3 text-left font-medium text-concrete">Fecha nacimiento</th>
                  <th className="px-4 py-3 text-right font-medium text-concrete">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p, i) => (
                  <tr key={p.id} className={i < pacientes.length - 1 ? "border-b border-hairline" : ""}>
                    <td className="px-4 py-3 font-medium text-graphite">
                      {p.nombre} {p.apellido}
                    </td>
                    <td className="px-4 py-3 font-mono text-concrete">{p.documento_identidad}</td>
                    <td className="px-4 py-3 text-concrete">{p.fecha_nacimiento}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/pacientes/$pacienteId", params: { pacienteId: p.id } })}
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
