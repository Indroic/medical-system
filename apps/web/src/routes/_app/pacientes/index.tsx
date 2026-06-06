import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import PageHeader from "@/components/page-header";
import { useAuthStore } from "@/lib/auth-store";
import { pacientesApi } from "@/lib/python-api";
import type { PacienteResponse } from "@/lib/python-api";
import { toast } from "@heroui/react";

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
    pacientesApi
      .listar(token)
      .then((res) => setPacientes(res.items))
      .catch((err) => toast.danger("Error cargando pacientes"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-8">
      <PageHeader
        title="Pacientes"
        action={
          <button
            type="button"
            onClick={() => navigate({ to: "/pacientes/nuevo" })}
            className="rounded-full bg-green px-4 py-2 text-[13px] font-medium text-obsidian hover:bg-green-deep transition-colors"
          >
            Nuevo paciente
          </button>
        }
      />

      <div className="mt-8">
        {loading ? (
          <div className="rounded-2xl border border-charcoal p-8 text-center text-[13px] text-smoke">
            Cargando…
          </div>
        ) : pacientes.length === 0 ? (
          <div className="rounded-2xl border border-charcoal p-12 text-center">
            <p className="text-[14px] text-snow mb-2">No hay pacientes registrados</p>
            <p className="text-[13px] text-smoke mb-6">
              Crea el primer paciente para comenzar a subir estudios.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/pacientes/nuevo" })}
              className="rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep transition-colors"
            >
              Crear paciente
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-charcoal overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-charcoal bg-ash">
                  <th className="px-4 py-3 text-left text-smoke font-normal">Nombre</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Documento</th>
                  <th className="px-4 py-3 text-left text-smoke font-normal">Fecha nacimiento</th>
                  <th className="px-4 py-3 text-right text-smoke font-normal">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p, i) => (
                  <tr key={p.id} className={i < pacientes.length - 1 ? "border-b border-charcoal" : ""}>
                    <td className="px-4 py-3 text-snow">{p.nombre} {p.apellido}</td>
                    <td className="px-4 py-3 font-mono text-smoke">{p.documento_identidad}</td>
                    <td className="px-4 py-3 text-smoke">{p.fecha_nacimiento}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/pacientes/$pacienteId", params: { pacienteId: p.id } })}
                        className="text-green font-medium hover:underline"
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
