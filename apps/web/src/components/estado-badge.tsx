type Estado = "PENDIENTE" | "EN_ANALISIS" | "COMPLETADO" | string;

const STYLES: Record<string, string> = {
  PENDIENTE:    "bg-default text-muted",
  EN_ANALISIS:  "bg-info-soft text-info-soft-foreground",
  COMPLETADO:   "bg-success-soft text-success-soft-foreground",
};

const LABELS: Record<string, string> = {
  PENDIENTE:   "Pendiente",
  EN_ANALISIS: "En análisis",
  COMPLETADO:  "Completado",
};

export default function EstadoBadge({ estado }: { estado: Estado }) {
  const cls = STYLES[estado] ?? "bg-default text-muted";
  return (
    <span className={`inline-flex items-center rounded-badges px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>
      {LABELS[estado] ?? estado}
    </span>
  );
}
