import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import PageHeader from "@/components/page-header";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, pacientesApi } from "@/lib/python-api";

export const Route = createFileRoute("/_app/pacientes/nuevo")({
  component: NuevoPaciente,
});

const INPUT_CLASS =
  "w-full rounded-[10px] border border-hairline bg-chalk px-3 py-2.5 font-mono text-[14px] text-graphite placeholder:text-concrete focus:outline-none focus:border-graphite transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-graphite">{label}</label>
      {children}
    </div>
  );
}

function NuevoPaciente() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    documento_identidad: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const paciente = await pacientesApi.crear(token, form);
      toast.success("Paciente creado correctamente");
      navigate({ to: "/pacientes/$pacienteId", params: { pacienteId: paciente.id } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al crear paciente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Nuevo paciente"
        subtitle="Registra los datos del paciente antes de subir el estudio."
        action={
          <button
            type="button"
            onClick={() => navigate({ to: "/pacientes" })}
            className="text-[13px] text-concrete hover:text-graphite transition-colors"
          >
            ← Volver
          </button>
        }
      />

      <div className="mt-8 max-w-lg">
        <div className="rounded-[14px] border border-hairline bg-chalk p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre">
                <input
                  type="text"
                  value={form.nombre}
                  onChange={set("nombre")}
                  placeholder="María"
                  required
                  minLength={2}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Apellido">
                <input
                  type="text"
                  value={form.apellido}
                  onChange={set("apellido")}
                  placeholder="García"
                  required
                  minLength={2}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>

            <Field label="Fecha de nacimiento">
              <input
                type="date"
                value={form.fecha_nacimiento}
                onChange={set("fecha_nacimiento")}
                required
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Documento de identidad">
              <input
                type="text"
                value={form.documento_identidad}
                onChange={set("documento_identidad")}
                placeholder="12345678"
                required
                className={INPUT_CLASS}
              />
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-[10px] bg-graphite px-5 py-2.5 text-[14px] font-medium text-chalk hover:bg-carbon disabled:opacity-50 transition-colors"
              >
                {loading ? "Guardando…" : "Crear paciente"}
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/pacientes" })}
                className="rounded-[10px] border border-hairline px-5 py-2.5 text-[14px] font-medium text-graphite hover:bg-mist transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
