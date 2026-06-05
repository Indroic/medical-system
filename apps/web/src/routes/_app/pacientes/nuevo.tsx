import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";

import PageHeader from "@/components/page-header";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, pacientesApi } from "@/lib/python-api";

export const Route = createFileRoute("/_app/pacientes/nuevo")({
  component: NuevoPaciente,
});

function NuevoPaciente() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    documento_identidad: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      setError(null);
      const paciente = await pacientesApi.crear(token, form);
      navigate({ to: "/pacientes/$pacienteId", params: { pacienteId: paciente.id } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear paciente");
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
            className="text-[13px] text-smoke hover:text-silver transition-colors"
          >
            ← Volver
          </button>
        }
      />

      <div className="mt-8 max-w-lg">
        <div className="rounded-2xl border border-charcoal bg-ash p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <TextField name="nombre" value={form.nombre} onChange={set("nombre")} isRequired className="w-full">
                <Label className="text-[13px] text-silver mb-1.5">Nombre</Label>
                <Input placeholder="María" />
                <FieldError />
              </TextField>
              <TextField name="apellido" value={form.apellido} onChange={set("apellido")} isRequired className="w-full">
                <Label className="text-[13px] text-silver mb-1.5">Apellido</Label>
                <Input placeholder="García" />
                <FieldError />
              </TextField>
            </div>

            <TextField name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} isRequired className="w-full">
              <Label className="text-[13px] text-silver mb-1.5">Fecha de nacimiento</Label>
              <Input />
              <FieldError />
            </TextField>

            <TextField name="documento_identidad" value={form.documento_identidad} onChange={set("documento_identidad")} isRequired className="w-full">
              <Label className="text-[13px] text-silver mb-1.5">Documento de identidad</Label>
              <Input placeholder="12345678" />
              <FieldError />
            </TextField>

            {error && (
              <p className="text-[13px] text-smoke border border-charcoal rounded-lg px-3 py-2 bg-obsidian">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                isDisabled={loading}
                className="rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors"
              >
                {loading ? "Guardando…" : "Crear paciente"}
              </Button>
              <button
                type="button"
                onClick={() => navigate({ to: "/pacientes" })}
                className="rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-ash hover:border-slate transition-colors"
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
