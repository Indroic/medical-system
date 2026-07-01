type NivelRiesgo = "BAJO" | "MODERADO" | "CRITICO" | "NO_EVALUADO" | string;

const STYLES: Record<string, string> = {
  NO_EVALUADO: "bg-surface text-muted border-border",
  BAJO:        "bg-success/10 text-success border-success/30",
  MODERADO:    "bg-muted/15 text-ash border-transparent",
  CRITICO:     "bg-bone text-void border-transparent",
};

const LABELS: Record<string, string> = {
  NO_EVALUADO: "No evaluado",
  BAJO:        "Riesgo bajo",
  MODERADO:    "Riesgo moderado",
  CRITICO:     "Riesgo crítico",
};

export default function RiesgoBadge({ nivel }: { nivel: NivelRiesgo }) {
  const cls = STYLES[nivel] ?? "bg-surface text-muted border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium ${cls}`}>
      {LABELS[nivel] ?? nivel}
    </span>
  );
}
