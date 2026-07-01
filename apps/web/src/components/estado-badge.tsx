type Estado = "PENDIENTE" | "EN_ANALISIS" | "COMPLETADO" | string;

const STYLES: Record<string, string> = {
  PENDIENTE:    "bg-surface text-muted border-border",
  EN_ANALISIS:  "bg-muted/15 text-ash border-transparent",
  COMPLETADO:   "bg-success/10 text-success border-success/30",
};

const LABELS: Record<string, string> = {
  PENDIENTE:   "Pendiente",
  EN_ANALISIS: "En análisis",
  COMPLETADO:  "Completado",
};

export default function EstadoBadge({ estado }: { estado: Estado }) {
  const cls = STYLES[estado] ?? "bg-surface text-muted border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>
      {LABELS[estado] ?? estado}
    </span>
  );
}
