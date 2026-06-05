import type { PacienteResponse } from "@/lib/python-api";

export default function PatientCard({ paciente }: { paciente: PacienteResponse }) {
  return (
    <div className="rounded-2xl border border-charcoal bg-ash p-5">
      <p className="text-[11px] font-medium text-smoke uppercase tracking-widest mb-3">Paciente</p>
      <p className="text-[17px] font-normal text-snow mb-3">
        {paciente.nombre} {paciente.apellido}
      </p>
      <div className="flex gap-6">
        <div>
          <p className="text-[11px] text-smoke mb-0.5">Documento</p>
          <p className="text-[13px] font-medium text-silver">{paciente.documento_identidad}</p>
        </div>
        <div>
          <p className="text-[11px] text-smoke mb-0.5">Fecha de nacimiento</p>
          <p className="text-[13px] font-medium text-silver">{paciente.fecha_nacimiento}</p>
        </div>
      </div>
    </div>
  );
}
