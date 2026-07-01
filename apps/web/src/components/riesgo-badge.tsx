type NivelRiesgo = "BAJO" | "MODERADO" | "CRITICO" | "NO_EVALUADO" | string;

const STYLES: Record<string, string> = {
  NO_EVALUADO: "bg-default text-muted",
  BAJO:        "bg-success-soft text-success-soft-foreground",
  MODERADO:    "bg-warning-soft text-warning-soft-foreground",
  CRITICO:     "bg-danger-soft text-danger-soft-foreground",
};

const LABELS: Record<string, string> = {
  NO_EVALUADO: "No evaluado",
  BAJO:        "Riesgo bajo",
  MODERADO:    "Riesgo moderado",
  CRITICO:     "Riesgo crítico",
};

export default function RiesgoBadge({ nivel }: { nivel: NivelRiesgo }) {
  const cls = STYLES[nivel] ?? "bg-default text-muted";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-badges px-3 py-1 text-[12px] font-medium ${cls}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {LABELS[nivel] ?? nivel}
    </span>
  );
}
