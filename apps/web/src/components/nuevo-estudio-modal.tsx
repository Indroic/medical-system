import { useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button, FieldError, Input, Label, Modal, TextField, toast } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";

import PatientCard from "@/components/patient-card";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, estudiosApi, pacientesApi } from "@/lib/python-api";
import type { PacienteResponse } from "@/lib/python-api";

interface NuevoEstudioModalProps {
  state: any;
  prefilledPacienteId?: string;
}

export default function NuevoEstudioModal({ state, prefilledPacienteId }: NuevoEstudioModalProps) {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<"patient" | "upload">("patient");
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [findDocumento, setFindDocumento] = useState("");
  const [createMode, setCreateMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resetear el estado al abrir el modal
  useEffect(() => {
    if (state.isOpen) {
      if (prefilledPacienteId) {
        setStep("upload");
      } else {
        setStep("patient");
        setPaciente(null);
        setCreateMode(false);
        setFindDocumento("");
      }
      setFiles([]);
    }
  }, [state.isOpen, prefilledPacienteId]);

  useEffect(() => {
    if (state.isOpen && prefilledPacienteId && token) {
      pacientesApi.obtener(token, prefilledPacienteId).then(setPaciente).catch(() => {});
    }
  }, [state.isOpen, prefilledPacienteId, token]);

  const createPatientForm = useForm({
    defaultValues: {
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",
      documento_identidad: "",
    },
    onSubmit: async ({ value }) => {
      if (!token) return;
      try {
        const p = await pacientesApi.crear(token, value);
        setPaciente(p);
        setStep("upload");
        toast.success("Paciente creado correctamente");
      } catch (err) {
        toast.danger(err instanceof ApiError ? err.message : "Error al crear paciente");
      }
    },
  });

  const handleFindPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMode(true);
    createPatientForm.setFieldValue("documento_identidad", findDocumento);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !paciente || files.length === 0) return;
    setUploading(true);
    try {
      const estudio = await estudiosApi.crear(token, paciente.id, files);
      toast.success("Estudio subido correctamente");
      state.close();
      navigate({ to: "/estudios/$estudioId", params: { estudioId: estudio.id } });
    } catch (err) {
      toast.danger(err instanceof ApiError ? err.message : "Error al subir estudio");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Container>
        <Modal.Dialog className="bg-surface border border-border sm:max-w-2xl w-full">
          <Modal.CloseTrigger />
          <Modal.Header className="flex flex-col gap-1 text-foreground">
            <Modal.Heading>Nuevo estudio</Modal.Heading>
            <div className="mt-2 flex items-center gap-3">
                {["Paciente", "Imagen"].map((label, idx) => {
                  const active = (idx === 0 && step === "patient") || (idx === 1 && step === "upload");
                  const done = idx === 0 && step === "upload";
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                          done ? "bg-accent text-accent-foreground"
                          : active ? "border border-accent text-accent"
                          : "border border-border text-muted"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className={`text-[13px] ${active ? "font-medium text-foreground" : "text-muted"}`}>
                        {label}
                      </span>
                      {idx === 0 && <span className="text-border mx-1">—</span>}
                    </div>
                  );
                })}
              </div>
          </Modal.Header>
          <Modal.Body className="pb-6">
              {/* Step 1: Patient */}
              {step === "patient" && (
                <div className="rounded-2xl border border-border bg-background p-6 mt-2">
                  <h2 className="text-[14px] text-foreground mb-4">Seleccionar paciente</h2>
                  {!createMode ? (
                    <form onSubmit={handleFindPatient} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] text-ash">Buscar por documento de identidad</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={findDocumento}
                            onChange={(e) => setFindDocumento(e.target.value)}
                            placeholder="12345678"
                            className="flex-1 rounded-lg border border-field-border bg-surface px-3 py-2 text-[14px] text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-border px-4 text-[13px] text-foreground hover:bg-surface-hover hover:border-field-border transition-colors whitespace-nowrap"
                          >
                            Buscar
                          </button>
                        </div>
                      </div>
                      <p className="text-[12px] text-muted">
                        ¿Paciente nuevo?{" "}
                        <button
                          type="button"
                          onClick={() => setCreateMode(true)}
                          className="text-link font-medium hover:underline"
                        >
                          Crear paciente
                        </button>
                      </p>
                    </form>
                  ) : (
                    <form
                      id="nuevo-paciente-estudio-form"
                      onSubmit={(e) => { e.preventDefault(); createPatientForm.handleSubmit(); }}
                      className="flex flex-col gap-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <createPatientForm.Field name="nombre" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                          {(field) => (
                            <TextField name={field.name} value={field.state.value} onChange={field.handleChange} isRequired className="w-full">
                              <Label className="text-[13px] text-ash mb-1.5">Nombre</Label>
                              <Input placeholder="María" className="bg-surface border-field-border" />
                              <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                            </TextField>
                          )}
                        </createPatientForm.Field>
                        <createPatientForm.Field name="apellido" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                          {(field) => (
                            <TextField name={field.name} value={field.state.value} onChange={field.handleChange} isRequired className="w-full">
                              <Label className="text-[13px] text-ash mb-1.5">Apellido</Label>
                              <Input placeholder="García" className="bg-surface border-field-border" />
                              <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                            </TextField>
                          )}
                        </createPatientForm.Field>
                      </div>
                      <createPatientForm.Field name="fecha_nacimiento" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                        {(field) => (
                          <TextField name={field.name} type="date" value={field.state.value} onChange={field.handleChange} isRequired className="w-full">
                            <Label className="text-[13px] text-ash mb-1.5">Fecha de nacimiento</Label>
                            <Input className="bg-surface border-field-border" />
                            <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                          </TextField>
                        )}
                      </createPatientForm.Field>
                      <createPatientForm.Field name="documento_identidad" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                        {(field) => (
                          <TextField name={field.name} value={field.state.value} onChange={field.handleChange} isRequired className="w-full">
                            <Label className="text-[13px] text-ash mb-1.5">Documento de identidad</Label>
                            <Input placeholder="12345678" className="bg-surface border-field-border" />
                            <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                          </TextField>
                        )}
                      </createPatientForm.Field>

                      <div className="flex gap-3 pt-1">
                        <createPatientForm.Subscribe selector={(s) => s.isSubmitting}>
                          {(isSubmitting) => (
                            <Button
                              type="submit"
                              isDisabled={isSubmitting}
                              className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50 transition-colors"
                            >
                              {isSubmitting ? "Guardando…" : "Crear y continuar"}
                            </Button>
                          )}
                        </createPatientForm.Subscribe>
                        <button
                          type="button"
                          onClick={() => setCreateMode(false)}
                          className="text-[13px] text-muted hover:text-ash transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Step 2: Upload */}
              {step === "upload" && paciente && (
                <div className="flex flex-col gap-4 mt-2">
                  <PatientCard paciente={paciente} />

                  <div className="rounded-2xl border border-border bg-background p-6">
                    <h2 className="text-[14px] text-foreground mb-4">Subir imagen CT</h2>
                    <form id="nuevo-estudio-upload-form" onSubmit={handleUpload} className="flex flex-col gap-5">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,.dcm"
                        multiple
                        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileRef.current?.click()}
                        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 cursor-pointer transition-colors ${
                          files.length > 0 ? "border-accent/50 bg-accent/5" : "border-border hover:border-field-border hover:bg-surface"
                        }`}
                      >
                        {files.length > 0 ? (
                          <>
                            <p className="text-[13px] font-medium text-foreground">{files.length} archivo(s) seleccionado(s)</p>
                            <p className="text-[12px] text-muted mt-1 text-center">
                              {files.map(f => f.name).join(", ").slice(0, 50)}
                              {files.join(", ").length > 50 ? "..." : ""}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-[13px] text-ash">Seleccionar imágenes (Múltiples cortes)</p>
                            <p className="text-[12px] text-muted mt-1">Soporta PNG, JPEG o DICOM</p>
                          </>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </Modal.Body>
          <Modal.Footer className="flex flex-col sm:flex-row gap-3 w-full justify-between items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {step === "upload" && (
                <button
                  type="button"
                  onClick={() => { setStep("patient"); setPaciente(null); setFiles([]); }}
                  className="rounded-full border border-border px-5 py-2 text-[14px] text-foreground hover:bg-background hover:border-field-border transition-colors w-full sm:w-auto text-center"
                >
                  Cambiar paciente
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={state.close}
                className="rounded-full border border-border px-5 py-2 text-[14px] text-foreground hover:bg-background hover:border-field-border transition-colors w-full sm:w-auto text-center"
              >
                Cerrar
              </button>
              {step === "upload" && (
                <Button
                  type="submit"
                  form="nuevo-estudio-upload-form"
                  isDisabled={files.length === 0 || uploading}
                  className="rounded-full bg-accent px-5 py-2 text-[14px] font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50 transition-colors w-full sm:w-auto text-center"
                >
                  {uploading ? "Subiendo…" : "Crear estudio"}
                </Button>
              )}
            </div>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
