type Estado = "PENDIENTE" | "EN_ANALISIS" | "COMPLETADO" | string;

const STYLES: Record<string, string> = {
  PENDIENTE:    "bg-default text-muted",
  EN_ANALISIS:  "bg-info-soft text-info-soft-foreground",
  COMPLETADO:   "bg-success-soft text-success-soft-foreground",
  // Estados del reporte médico
  GENERANDO:    "bg-info-soft text-info-soft-foreground",
  LISTO:        "bg-warning-soft text-warning-soft-foreground",
  APROBADO:     "bg-success-soft text-success-soft-foreground",
  FALLIDO:      "bg-danger-soft text-danger-soft-foreground",
};

const LABELS: Record<string, string> = {
  PENDIENTE:   "Pendiente",
  EN_ANALISIS: "En análisis",
  COMPLETADO:  "Completado",
  GENERANDO:   "Generando…",
  // Un reporte LISTO todavía está pendiente de validación médica.
  LISTO:       "Pendiente de aprobación",
  APROBADO:    "Aprobado",
  FALLIDO:     "Fallido",
};

// Estados "en progreso": muestran el spinner dentro del badge.
const EN_PROGRESO = new Set(["EN_ANALISIS", "GENERANDO"]);

export default function EstadoBadge({ estado }: { estado: Estado }) {
  const cls = STYLES[estado] ?? "bg-default text-muted";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-badges px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>
      {EN_PROGRESO.has(estado) && (
        <span
          className="size-2.5 shrink-0 rounded-full border-[1.5px] border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      )}
      {LABELS[estado] ?? estado}
    </span>
  );
}
