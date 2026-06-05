import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";

import PageHeader from "@/components/page-header";
import PatientCard from "@/components/patient-card";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError, estudiosApi, pacientesApi } from "@/lib/python-api";
import type { PacienteResponse } from "@/lib/python-api";

export const Route = createFileRoute("/_app/estudios/nuevo")({
  validateSearch: (s: Record<string, unknown>) => ({
    pacienteId: typeof s.pacienteId === "string" ? s.pacienteId : undefined,
  }),
  component: NuevoEstudio,
});

function NuevoEstudio() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const { pacienteId: prefilledId } = useSearch({ from: "/_app/estudios/nuevo" });

  const [step, setStep] = useState<"patient" | "upload">(prefilledId ? "upload" : "patient");
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [findDocumento, setFindDocumento] = useState("");
  const [findLoading, setFindLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newPaciente, setNewPaciente] = useState({
    nombre: "", apellido: "", fecha_nacimiento: "", documento_identidad: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefilledId && token) {
      pacientesApi.obtener(token, prefilledId).then(setPaciente).catch(() => {});
    }
  }, [prefilledId, token]);

  const handleFindPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !findDocumento) return;
    setFindLoading(true);
    try {
      setCreateMode(true);
      setNewPaciente((prev) => ({ ...prev, documento_identidad: findDocumento }));
    } finally {
      setFindLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFindLoading(true);
    try {
      const p = await pacientesApi.crear(token, newPaciente);
      setPaciente(p);
      setStep("upload");
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Error al crear paciente");
    } finally {
      setFindLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !paciente || !file) return;
    setLoading(true);
    try {
      const estudio = await estudiosApi.crear(token, paciente.id, file);
      navigate({ to: "/estudios/$estudioId", params: { estudioId: estudio.id } });
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Error al subir estudio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Nuevo estudio"
        action={
          <button
            type="button"
            onClick={() => navigate({ to: "/estudios" })}
            className="text-[13px] text-smoke hover:text-silver transition-colors"
          >
            ← Volver
          </button>
        }
      />

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-3 mb-8">
        {["Paciente", "Imagen"].map((label, idx) => {
          const active = (idx === 0 && step === "patient") || (idx === 1 && step === "upload");
          const done = idx === 0 && step === "upload";
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                  done
                    ? "bg-green text-obsidian"
                    : active
                    ? "border border-green text-green"
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

      <div className="max-w-lg">
        {/* Step 1: Patient */}
        {step === "patient" && (
          <div className="rounded-2xl border border-charcoal bg-ash p-6">
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
                      className="flex-1 rounded-lg border border-slate bg-obsidian px-3 py-2 text-[14px] text-snow placeholder:text-smoke focus:outline-none focus:border-green transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={findLoading}
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
              <form onSubmit={handleCreatePatient} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <TextField name="nombre" value={newPaciente.nombre} onChange={(v) => setNewPaciente((p) => ({ ...p, nombre: v }))} isRequired className="w-full">
                    <Label className="text-[13px] text-silver mb-1.5">Nombre</Label>
                    <Input placeholder="María" />
                    <FieldError />
                  </TextField>
                  <TextField name="apellido" value={newPaciente.apellido} onChange={(v) => setNewPaciente((p) => ({ ...p, apellido: v }))} isRequired className="w-full">
                    <Label className="text-[13px] text-silver mb-1.5">Apellido</Label>
                    <Input placeholder="García" />
                    <FieldError />
                  </TextField>
                </div>
                <TextField name="fecha_nacimiento" type="date" value={newPaciente.fecha_nacimiento} onChange={(v) => setNewPaciente((p) => ({ ...p, fecha_nacimiento: v }))} isRequired className="w-full">
                  <Label className="text-[13px] text-silver mb-1.5">Fecha de nacimiento</Label>
                  <Input />
                  <FieldError />
                </TextField>
                <TextField name="documento_identidad" value={newPaciente.documento_identidad} onChange={(v) => setNewPaciente((p) => ({ ...p, documento_identidad: v }))} isRequired className="w-full">
                  <Label className="text-[13px] text-silver mb-1.5">Documento de identidad</Label>
                  <Input placeholder="12345678" />
                  <FieldError />
                </TextField>
                {createError && (
                  <p className="text-[13px] text-smoke border border-charcoal rounded-lg px-3 py-2 bg-obsidian">
                    {createError}
                  </p>
                )}
                <div className="flex gap-3 pt-1">
                  <Button
                    type="submit"
                    isDisabled={findLoading}
                    className="rounded-full bg-green px-5 py-2 text-[13px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors"
                  >
                    {findLoading ? "Guardando…" : "Crear y continuar"}
                  </Button>
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
          <div className="flex flex-col gap-4">
            <PatientCard paciente={paciente} />

            <div className="rounded-2xl border border-charcoal bg-ash p-6">
              <h2 className="text-[14px] text-snow mb-4">Subir imagen CT</h2>
              <form onSubmit={handleUpload} className="flex flex-col gap-5">
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
                    file
                      ? "border-green/50 bg-green/5"
                      : "border-charcoal hover:border-slate hover:bg-obsidian"
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

                {uploadError && (
                  <p className="text-[13px] text-smoke border border-charcoal rounded-lg px-3 py-2 bg-obsidian">
                    {uploadError}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    isDisabled={!file || loading}
                    className="rounded-full bg-green px-5 py-2 text-[14px] font-medium text-obsidian hover:bg-green-deep disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Subiendo…" : "Crear estudio"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setStep("patient"); setPaciente(null); setFile(null); }}
                    className="rounded-full border border-charcoal px-5 py-2 text-[14px] text-snow hover:bg-ash hover:border-slate transition-colors"
                  >
                    Cambiar paciente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
