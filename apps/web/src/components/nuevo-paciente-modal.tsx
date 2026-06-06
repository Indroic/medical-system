import { useForm } from "@tanstack/react-form";
import { Button, FieldError, Input, Label, Modal, TextField, toast } from "@heroui/react";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, pacientesApi } from "@/lib/python-api";
import type { PacienteResponse } from "@/lib/python-api";

interface NuevoPacienteModalProps {
  state: any;
  onPacienteCreado?: (paciente: PacienteResponse) => void;
}

export default function NuevoPacienteModal({ state, onPacienteCreado }: NuevoPacienteModalProps) {
  const { token } = useAuthStore();

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
        toast.success("Paciente creado correctamente");
        form.reset();
        state.close();
        if (onPacienteCreado) {
          onPacienteCreado(paciente);
        }
      } catch (err) {
        toast.danger(err instanceof ApiError ? err.message : "Error al crear paciente");
      }
    },
  });

  return (
    <Modal>
      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
        <Modal.Container>
          <Modal.Dialog className="bg-ash border border-charcoal sm:max-w-2xl w-full">
            <Modal.CloseTrigger />
          <Modal.Header className="flex flex-col gap-1 text-snow">
            <Modal.Heading>Nuevo paciente</Modal.Heading>
            <p className="text-[13px] text-smoke font-normal mt-1">Registra los datos del paciente antes de subir el estudio.</p>
          </Modal.Header>
          <Modal.Body>
              <form
                id="nuevo-paciente-form"
                onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
                className="flex flex-col gap-5 py-2"
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
                        <Input placeholder="María" className="bg-obsidian border-slate" />
                        <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
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
                        <Input placeholder="García" className="bg-obsidian border-slate" />
                        <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
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
                      <Input className="bg-obsidian border-slate" />
                      <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
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
                      <Input placeholder="12345678" className="bg-obsidian border-slate" />
                      <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                    </TextField>
                  )}
                </form.Field>
              </form>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              onClick={state.close}
              className="rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-obsidian hover:border-slate transition-colors"
            >
                Cancelar
              </button>
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    form="nuevo-paciente-form"
                    isDisabled={isSubmitting}
                    className="rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? "Guardando…" : "Crear paciente"}
                  </Button>
                )}
            </form.Subscribe>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
