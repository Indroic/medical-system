import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import PageHeader from "@/components/page-header";
import { useAuthStore } from "@/lib/auth-store";
import { pacientesApi } from "@/lib/python-api";
import type { PacienteResponse } from "@/lib/python-api";
import { toast, useOverlayState } from "@heroui/react";
import NuevoPacienteModal from "@/components/nuevo-paciente-modal";

export const Route = createFileRoute("/_app/pacientes/")({
  component: PacientesList,
});

function PacientesList() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const state = useOverlayState({ defaultOpen: false });

  useEffect(() => {
    if (!token) return;
    pacientesApi
      .listar(token)
      .then((res) => setPacientes(res.items))
      .catch(() => toast.danger("Error cargando pacientes"))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = pacientes.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.apellido.toLowerCase().includes(q) ||
      p.documento_identidad.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Pacientes"
        action={
          <button
            type="button"
            onClick={state.open}
            className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground hover:bg-accent-hover transition-colors"
          >
            Nuevo paciente
          </button>
        }
      />

      <div className="mt-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, apellido o documento…"
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-field-border transition-colors"
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="rounded-2xl border border-border p-8 text-center text-[13px] text-muted">
            Cargando…
          </div>
        ) : pacientes.length === 0 ? (
          <div className="rounded-2xl border border-border p-12 text-center">
            <p className="text-[14px] text-foreground mb-2">No hay pacientes registrados</p>
            <p className="text-[13px] text-muted mb-6">
              Crea el primer paciente para comenzar a subir estudios.
            </p>
            <button
              type="button"
              onClick={state.open}
              className="rounded-full bg-accent px-5 py-2 text-[14px] font-medium text-accent-foreground hover:bg-accent-hover transition-colors"
            >
              Crear paciente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border p-8 text-center text-[13px] text-muted">
            Sin resultados para "{search}"
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-muted font-normal">Nombre</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Documento</th>
                  <th className="px-4 py-3 text-left text-muted font-normal">Fecha nacimiento</th>
                  <th className="px-4 py-3 text-right text-muted font-normal">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={i < filtered.length - 1 ? "border-b border-border" : ""}>
                    <td className="px-4 py-3 text-foreground">{p.nombre} {p.apellido}</td>
                    <td className="px-4 py-3 font-mono text-muted">{p.documento_identidad}</td>
                    <td className="px-4 py-3 text-muted">{p.fecha_nacimiento}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/pacientes/$pacienteId", params: { pacienteId: p.id } })}
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

      <NuevoPacienteModal
        state={state}
        onPacienteCreado={(paciente) => setPacientes((prev) => [...prev, paciente])}
      />
    </div>
  );
}
