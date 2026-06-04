import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

function NuevoEstudio() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const { pacienteId: prefilledId } = useSearch({ from: "/_app/estudios/nuevo" });

  const [step, setStep] = useState<"patient" | "upload">(prefilledId ? "upload" : "patient");
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: find or create patient
  const [findDocumento, setFindDocumento] = useState("");
  const [findLoading, setFindLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newPaciente, setNewPaciente] = useState({
    nombre: "", apellido: "", fecha_nacimiento: "", documento_identidad: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  // Load prefilled patient
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
      // API doesn't have a search-by-documento endpoint yet.
      // Create new with the document if not found.
      toast.info("Buscar por documento no disponible aún. Crea un nuevo paciente.");
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
      toast.success("Paciente creado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al crear paciente");
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
      toast.success("Estudio creado correctamente");
      navigate({ to: "/estudios/$estudioId", params: { estudioId: estudio.id } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al subir estudio");
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
            className="text-[13px] text-concrete hover:text-graphite transition-colors"
          >
            ← Volver
          </button>
        }
      />

      {/* Step indicator */}
      <div className="mt-6 flex gap-2 mb-8">
        {["Paciente", "Imagen"].map((label, idx) => {
          const active = (idx === 0 && step === "patient") || (idx === 1 && step === "upload");
          const done = (idx === 0 && step === "upload");
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-[26px] text-[11px] font-medium ${
                  done
                    ? "bg-graphite text-chalk"
                    : active
                    ? "border border-graphite text-graphite"
                    : "border border-hairline text-concrete"
                }`}
              >
                {idx + 1}
              </span>
              <span className={`text-[13px] ${active ? "font-medium text-graphite" : "text-concrete"}`}>
                {label}
              </span>
              {idx === 0 && <span className="text-hairline mx-1">—</span>}
            </div>
          );
        })}
      </div>

      <div className="max-w-lg">
        {/* Step 1: Patient */}
        {step === "patient" && (
          <div className="rounded-[14px] border border-hairline bg-chalk p-6">
            <h2 className="text-[14px] font-semibold text-graphite mb-4">Seleccionar paciente</h2>

            {!createMode ? (
              <form onSubmit={handleFindPatient} className="flex flex-col gap-4">
                <Field label="Buscar por documento de identidad">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={findDocumento}
                      onChange={(e) => setFindDocumento(e.target.value)}
                      placeholder="12345678"
                      className={INPUT_CLASS}
                    />
                    <button
                      type="submit"
                      disabled={findLoading}
                      className="rounded-[10px] border border-hairline px-4 text-[13px] font-medium text-graphite hover:bg-mist transition-colors whitespace-nowrap"
                    >
                      Buscar
                    </button>
                  </div>
                </Field>
                <p className="text-[12px] text-concrete">
                  ¿Paciente nuevo?{" "}
                  <button
                    type="button"
                    onClick={() => setCreateMode(true)}
                    className="text-graphite font-medium hover:underline"
                  >
                    Crear paciente
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleCreatePatient} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nombre">
                    <input
                      type="text"
                      value={newPaciente.nombre}
                      onChange={(e) => setNewPaciente((p) => ({ ...p, nombre: e.target.value }))}
                      placeholder="María"
                      required
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Apellido">
                    <input
                      type="text"
                      value={newPaciente.apellido}
                      onChange={(e) => setNewPaciente((p) => ({ ...p, apellido: e.target.value }))}
                      placeholder="García"
                      required
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>
                <Field label="Fecha de nacimiento">
                  <input
                    type="date"
                    value={newPaciente.fecha_nacimiento}
                    onChange={(e) => setNewPaciente((p) => ({ ...p, fecha_nacimiento: e.target.value }))}
                    required
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Documento de identidad">
                  <input
                    type="text"
                    value={newPaciente.documento_identidad}
                    onChange={(e) => setNewPaciente((p) => ({ ...p, documento_identidad: e.target.value }))}
                    placeholder="12345678"
                    required
                    className={INPUT_CLASS}
                  />
                </Field>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={findLoading}
                    className="rounded-[10px] bg-graphite px-5 py-2 text-[13px] font-medium text-chalk hover:bg-carbon disabled:opacity-50 transition-colors"
                  >
                    {findLoading ? "Guardando…" : "Crear y continuar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode(false)}
                    className="text-[13px] text-concrete hover:text-graphite transition-colors"
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

            <div className="rounded-[14px] border border-hairline bg-chalk p-6">
              <h2 className="text-[14px] font-semibold text-graphite mb-4">Subir imagen CT</h2>
              <form onSubmit={handleUpload} className="flex flex-col gap-5">
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,.dcm"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-[14px] border border-dashed px-6 py-10 cursor-pointer transition-colors ${
                      file ? "border-graphite bg-mist" : "border-hairline hover:border-ash hover:bg-mist"
                    }`}
                  >
                    {file ? (
                      <>
                        <p className="text-[13px] font-medium text-graphite">{file.name}</p>
                        <p className="text-[12px] text-concrete mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[13px] font-medium text-graphite">Seleccionar archivo</p>
                        <p className="text-[12px] text-concrete mt-1">PNG, JPEG o DICOM</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={!file || loading}
                    className="rounded-[10px] bg-graphite px-5 py-2.5 text-[14px] font-medium text-chalk hover:bg-carbon disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Subiendo…" : "Crear estudio"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep("patient"); setPaciente(null); setFile(null); }}
                    className="rounded-[10px] border border-hairline px-5 py-2.5 text-[14px] font-medium text-graphite hover:bg-mist transition-colors"
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
