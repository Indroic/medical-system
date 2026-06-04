type Estado = "PENDIENTE" | "EN_ANALISIS" | "COMPLETADO" | string;

const STYLES: Record<string, string> = {
  PENDIENTE: "bg-mist text-graphite border-hairline",
  EN_ANALISIS: "bg-carbon text-chalk border-transparent",
  COMPLETADO: "bg-graphite text-chalk border-transparent",
};

const LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_ANALISIS: "En análisis",
  COMPLETADO: "Completado",
};

export default function EstadoBadge({ estado }: { estado: Estado }) {
  const cls = STYLES[estado] ?? "bg-mist text-graphite border-hairline";
  return (
    <span
      className={`inline-flex items-center rounded-[26px] border px-2.5 py-0.5 text-[12px] font-medium ${cls}`}
    >
      {LABELS[estado] ?? estado}
    </span>
  );
}
