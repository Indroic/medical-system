import type { PacienteResponse } from "@/lib/python-api";

export default function PatientCard({ paciente }: { paciente: PacienteResponse }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-[11px] font-medium text-muted uppercase tracking-widest mb-3">Paciente</p>
      <p className="text-[17px] font-normal text-foreground mb-3">
        {paciente.nombre} {paciente.apellido}
      </p>
      <div className="flex gap-6">
        <div>
          <p className="text-[11px] text-muted mb-0.5">Documento</p>
          <p className="text-[13px] font-medium text-ash">{paciente.documento_identidad}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted mb-0.5">Fecha de nacimiento</p>
          <p className="text-[13px] font-medium text-ash">{paciente.fecha_nacimiento}</p>
        </div>
      </div>
    </div>
  );
}
