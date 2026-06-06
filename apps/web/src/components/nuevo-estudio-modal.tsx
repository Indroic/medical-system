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
  const [file, setFile] = useState<File | null>(null);
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
      setFile(null);
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
    if (!token || !paciente || !file) return;
    setUploading(true);
    try {
      const estudio = await estudiosApi.crear(token, paciente.id, file);
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
        <Modal.Dialog className="bg-ash border border-charcoal sm:max-w-2xl w-full">
          <Modal.CloseTrigger />
          <Modal.Header className="flex flex-col gap-1 text-snow">
            <Modal.Heading>Nuevo estudio</Modal.Heading>
            <div className="mt-2 flex items-center gap-3">
                {["Paciente", "Imagen"].map((label, idx) => {
                  const active = (idx === 0 && step === "patient") || (idx === 1 && step === "upload");
                  const done = idx === 0 && step === "upload";
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                          done ? "bg-green text-obsidian"
                          : active ? "border border-green text-green"
                          : "border border-charcoal text-smoke"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className={`text-[13px] ${active ? "font-medium text-snow" : "text-smoke"}`}>
                        {label}
                      </span>
                      {idx === 0 && <span className="text-charcoal mx-1">—</span>}
                    </div>
                  );
                })}
              </div>
          </Modal.Header>
          <Modal.Body className="pb-6">
              {/* Step 1: Patient */}
              {step === "patient" && (
                <div className="rounded-2xl border border-charcoal bg-obsidian p-6 mt-2">
                  <h2 className="text-[14px] text-snow mb-4">Seleccionar paciente</h2>
                  {!createMode ? (
                    <form onSubmit={handleFindPatient} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] text-silver">Buscar por documento de identidad</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={findDocumento}
                            onChange={(e) => setFindDocumento(e.target.value)}
                            placeholder="12345678"
                            className="flex-1 rounded-lg border border-slate bg-ash px-3 py-2 text-[14px] text-snow placeholder:text-smoke focus:outline-none focus:border-green transition-colors"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-charcoal px-4 text-[13px] text-snow hover:bg-ash hover:border-slate transition-colors whitespace-nowrap"
                          >
                            Buscar
                          </button>
                        </div>
                      </div>
                      <p className="text-[12px] text-smoke">
                        ¿Paciente nuevo?{" "}
                        <button
                          type="button"
                          onClick={() => setCreateMode(true)}
                          className="text-green font-medium hover:underline"
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
                      <div className="grid grid-cols-2 gap-4">
                        <createPatientForm.Field name="nombre" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                          {(field) => (
                            <TextField name={field.name} value={field.state.value} onChange={field.handleChange} isRequired className="w-full">
                              <Label className="text-[13px] text-silver mb-1.5">Nombre</Label>
                              <Input placeholder="María" className="bg-ash border-slate" />
                              <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                            </TextField>
                          )}
                        </createPatientForm.Field>
                        <createPatientForm.Field name="apellido" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                          {(field) => (
                            <TextField name={field.name} value={field.state.value} onChange={field.handleChange} isRequired className="w-full">
                              <Label className="text-[13px] text-silver mb-1.5">Apellido</Label>
                              <Input placeholder="García" className="bg-ash border-slate" />
                              <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                            </TextField>
                          )}
                        </createPatientForm.Field>
                      </div>
                      <createPatientForm.Field name="fecha_nacimiento" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                        {(field) => (
                          <TextField name={field.name} type="date" value={field.state.value} onChange={field.handleChange} isRequired className="w-full">
                            <Label className="text-[13px] text-silver mb-1.5">Fecha de nacimiento</Label>
                            <Input className="bg-ash border-slate" />
                            <FieldError className="text-danger">{field.state.meta.isTouched && field.state.meta.errors[0]}</FieldError>
                          </TextField>
                        )}
                      </createPatientForm.Field>
                      <createPatientForm.Field name="documento_identidad" validators={{ onChange: ({ value }) => !value ? "Requerido" : undefined }}>
                        {(field) => (
                          <TextField name={field.name} value={field.state.value} onChange={field.handleChange} isRequired className="w-full">
                            <Label className="text-[13px] text-silver mb-1.5">Documento de identidad</Label>
                            <Input placeholder="12345678" className="bg-ash border-slate" />
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
                              className="rounded-full bg-green px-5 py-2 text-[13px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors"
                            >
                              {isSubmitting ? "Guardando…" : "Crear y continuar"}
                            </Button>
                          )}
                        </createPatientForm.Subscribe>
                        <button
                          type="button"
                          onClick={() => setCreateMode(false)}
                          className="text-[13px] text-smoke hover:text-silver transition-colors"
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

                  <div className="rounded-2xl border border-charcoal bg-obsidian p-6">
                    <h2 className="text-[14px] text-snow mb-4">Subir imagen CT</h2>
                    <form id="nuevo-estudio-upload-form" onSubmit={handleUpload} className="flex flex-col gap-5">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,.dcm"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileRef.current?.click()}
                        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 cursor-pointer transition-colors ${
                          file ? "border-green/50 bg-green/5" : "border-charcoal hover:border-slate hover:bg-ash"
                        }`}
                      >
                        {file ? (
                          <>
                            <p className="text-[13px] font-medium text-snow">{file.name}</p>
                            <p className="text-[12px] text-smoke mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[13px] text-silver">Seleccionar archivo</p>
                            <p className="text-[12px] text-smoke mt-1">PNG, JPEG o DICOM</p>
                          </>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </Modal.Body>
          <Modal.Footer>
            {step === "upload" && (
              <button
                type="button"
                onClick={() => { setStep("patient"); setPaciente(null); setFile(null); }}
                className="rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-obsidian hover:border-slate transition-colors"
              >
                Cambiar paciente
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={state.close}
              className="rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-obsidian hover:border-slate transition-colors"
            >
                Cerrar
              </button>
              {step === "upload" && (
                <Button
                  type="submit"
                  form="nuevo-estudio-upload-form"
                  isDisabled={!file || uploading}
                  className="rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors"
                >
                  {uploading ? "Subiendo…" : "Crear estudio"}
                </Button>
              )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
