type Estado = "PENDIENTE" | "EN_ANALISIS" | "COMPLETADO" | string;

const STYLES: Record<string, string> = {
  PENDIENTE:    "bg-ash text-smoke border-charcoal",
  EN_ANALISIS:  "bg-slate/40 text-silver border-transparent",
  COMPLETADO:   "bg-green/10 text-green border-green/30",
};

const LABELS: Record<string, string> = {
  PENDIENTE:   "Pendiente",
  EN_ANALISIS: "En análisis",
  COMPLETADO:  "Completado",
};

export default function EstadoBadge({ estado }: { estado: Estado }) {
  const cls = STYLES[estado] ?? "bg-ash text-smoke border-charcoal";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>
      {LABELS[estado] ?? estado}
    </span>
  );
}
