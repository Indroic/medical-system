type NivelRiesgo = "BAJO" | "MODERADO" | "CRITICO" | "NO_EVALUADO" | string;

const STYLES: Record<string, string> = {
  BAJO: "bg-mist text-graphite border-hairline",
  MODERADO: "bg-ash text-graphite border-transparent",
  CRITICO: "bg-carbon text-chalk border-transparent",
  NO_EVALUADO: "bg-mist text-concrete border-hairline",
};

const LABELS: Record<string, string> = {
  BAJO: "Riesgo bajo",
  MODERADO: "Riesgo moderado",
  CRITICO: "Riesgo crítico",
  NO_EVALUADO: "No evaluado",
};

export default function RiesgoBadge({ nivel }: { nivel: NivelRiesgo }) {
  const cls = STYLES[nivel] ?? "bg-mist text-graphite border-hairline";
  return (
    <span
      className={`inline-flex items-center rounded-[26px] border px-3 py-1 text-[12px] font-medium ${cls}`}
    >
      {LABELS[nivel] ?? nivel}
    </span>
  );
}
