import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Button, FieldError, Input, Label, TextField, toast } from "@heroui/react";

import PageHeader from "@/components/page-header";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, pacientesApi } from "@/lib/python-api";

export const Route = createFileRoute("/_app/pacientes/nuevo")({
  component: NuevoPaciente,
});

function NuevoPaciente() {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",
      documento_identidad: "",
    },
    onSubmit: async ({ value }) => {
      if (!token) return;
      try {
        const paciente = await pacientesApi.crear(token, value);
        navigate({ to: "/pacientes/$pacienteId", params: { pacienteId: paciente.id } });
      } catch (err) {
        toast.danger(err instanceof ApiError ? err.message : "Error al crear paciente");
      }
    },
  });

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
          <form
            onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
            className="flex flex-col gap-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="nombre" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                {(field) => (
                  <TextField
                    name={field.name}
                    value={field.state.value}
                    onChange={field.handleChange}
                    isRequired
                    isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                    className="w-full"
                  >
                    <Label className="text-[13px] text-silver mb-1.5">Nombre</Label>
                    <Input placeholder="María" />
                    <FieldError>{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                  </TextField>
                )}
              </form.Field>

              <form.Field name="apellido" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                {(field) => (
                  <TextField
                    name={field.name}
                    value={field.state.value}
                    onChange={field.handleChange}
                    isRequired
                    isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                    className="w-full"
                  >
                    <Label className="text-[13px] text-silver mb-1.5">Apellido</Label>
                    <Input placeholder="García" />
                    <FieldError>{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                  </TextField>
                )}
              </form.Field>
            </div>

            <form.Field name="fecha_nacimiento" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
              {(field) => (
                <TextField
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={field.handleChange}
                  isRequired
                  isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  className="w-full"
                >
                  <Label className="text-[13px] text-silver mb-1.5">Fecha de nacimiento</Label>
                  <Input />
                  <FieldError>{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                </TextField>
              )}
            </form.Field>

            <form.Field name="documento_identidad" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
              {(field) => (
                <TextField
                  name={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  isRequired
                  isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  className="w-full"
                >
                  <Label className="text-[13px] text-silver mb-1.5">Documento de identidad</Label>
                  <Input placeholder="12345678" />
                  <FieldError>{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                </TextField>
              )}
            </form.Field>

            <div className="flex gap-3 pt-2">
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    isDisabled={isSubmitting}
                    className="rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? "Guardando…" : "Crear paciente"}
                  </Button>
                )}
              </form.Subscribe>
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
