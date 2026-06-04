import type { PacienteResponse } from "@/lib/python-api";

export default function PatientCard({ paciente }: { paciente: PacienteResponse }) {
  return (
    <div className="rounded-[14px] bg-carbon p-5">
      <p className="text-[12px] font-medium text-ash uppercase tracking-wide mb-3">Paciente</p>
      <p className="text-[18px] font-semibold text-chalk mb-1">
        {paciente.nombre} {paciente.apellido}
      </p>
      <div className="flex gap-4 mt-3">
        <div>
          <p className="text-[11px] text-ash mb-0.5">Documento</p>
          <p className="text-[13px] font-medium text-chalk">{paciente.documento_identidad}</p>
        </div>
        <div>
          <p className="text-[11px] text-ash mb-0.5">Fecha de nacimiento</p>
          <p className="text-[13px] font-medium text-chalk">{paciente.fecha_nacimiento}</p>
        </div>
      </div>
    </div>
  );
}
