import { useForm } from "@tanstack/react-form";
import { Button, FieldError, Input, Label, ListBox, Modal, Select, TextField, toast } from "@heroui/react";
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
      tipo_documento: "V" as "V" | "E",
      documento_identidad: "",
    },
    onSubmit: async ({ value }) => {
      if (!token) return;
      try {
        const { tipo_documento, ...rest } = value;
        const paciente = await pacientesApi.crear(token, {
          ...rest,
          documento_identidad: `${tipo_documento}-${rest.documento_identidad}`,
        });
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
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Container>
        <Modal.Dialog className="bg-surface border border-border sm:max-w-2xl w-full">
          <Modal.CloseTrigger />
          <Modal.Header className="flex flex-col gap-1 text-foreground">
            <Modal.Heading>Nuevo paciente</Modal.Heading>
            <p className="text-[13px] text-muted font-normal mt-1">Registra los datos del paciente antes de subir el estudio.</p>
          </Modal.Header>
          <Modal.Body>
              <form
                id="nuevo-paciente-form"
                onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
                className="flex flex-col gap-5 py-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <Label className="text-[13px] text-ash mb-1.5">Nombre</Label>
                        <Input placeholder="María" className="bg-background border-field-border" />
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
                        <Label className="text-[13px] text-ash mb-1.5">Apellido</Label>
                        <Input placeholder="García" className="bg-background border-field-border" />
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
                      <Label className="text-[13px] text-ash mb-1.5">Fecha de nacimiento</Label>
                      <Input className="bg-background border-field-border" />
                      <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                    </TextField>
                  )}
                </form.Field>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-ash">Documento de identidad</span>
                  <div className="flex gap-2 items-start">
                    <form.Field name="tipo_documento">
                      {(field) => (
                        <Select
                          value={field.state.value}
                          onChange={(v) => field.handleChange(v as "V" | "E")}
                          className="shrink-0 w-24"
                        >
                          <Label className="sr-only">Tipo</Label>
                          <Select.Trigger className="bg-background border-border h-full">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              <ListBox.Item id="V" textValue="V">
                                V
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              <ListBox.Item id="E" textValue="E">
                                E
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      )}
                    </form.Field>

                    <form.Field
                      name="documento_identidad"
                      validators={{
                        onChange: ({ value }) => {
                          if (!value) return "Requerido";
                          if (value.length < 6) return "Mínimo 6 dígitos";
                          return undefined;
                        },
                      }}
                    >
                      {(field) => (
                        <TextField
                          name={field.name}
                          value={field.state.value}
                          onChange={(v) => field.handleChange(v.replace(/\D/g, "").slice(0, 12))}
                          isRequired
                          isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
                          className="flex-1"
                        >
                          <Input
                            placeholder="12345678"
                            inputMode="numeric"
                            className="bg-background border-field-border"
                          />
                          <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                        </TextField>
                      )}
                    </form.Field>
                  </div>
                </div>
              </form>
            </Modal.Body>
            <Modal.Footer className="flex flex-col sm:flex-row gap-3 w-full justify-end">
              <button
                type="button"
                onClick={state.close}
                className="rounded-full border border-border px-5 py-2 text-[14px] text-foreground hover:bg-background hover:border-field-border transition-colors w-full sm:w-auto text-center"
              >
                Cancelar
              </button>
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    form="nuevo-paciente-form"
                    isDisabled={isSubmitting}
                    className="rounded-full bg-accent px-5 py-2 text-[14px] font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50 transition-colors w-full sm:w-auto text-center"
                  >
                    {isSubmitting ? "Guardando…" : "Crear paciente"}
                  </Button>
                )}
              </form.Subscribe>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </Modal.Backdrop>
  );
}
