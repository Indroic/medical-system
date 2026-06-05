type NivelRiesgo = "BAJO" | "MODERADO" | "CRITICO" | "NO_EVALUADO" | string;

const STYLES: Record<string, string> = {
  NO_EVALUADO: "bg-ash text-smoke border-charcoal",
  BAJO:        "bg-green/10 text-green border-green/30",
  MODERADO:    "bg-slate/40 text-silver border-transparent",
  CRITICO:     "bg-snow text-obsidian border-transparent",
};

const LABELS: Record<string, string> = {
  NO_EVALUADO: "No evaluado",
  BAJO:        "Riesgo bajo",
  MODERADO:    "Riesgo moderado",
  CRITICO:     "Riesgo crítico",
};

export default function RiesgoBadge({ nivel }: { nivel: NivelRiesgo }) {
  const cls = STYLES[nivel] ?? "bg-ash text-smoke border-charcoal";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium ${cls}`}>
      {LABELS[nivel] ?? nivel}
    </span>
  );
}
