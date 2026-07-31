/**
 * Marca del sistema. La insignia usa el azul de marca (`--accent`) y la cruz
 * su color de contraste, así que hereda el tema claro/oscuro sin duplicar
 * valores de color. El PDF tiene su propia copia en `reporte-pdf.tsx` porque
 * @react-pdf/renderer no entiende variables CSS.
 */

interface LogoMarkProps {
  /** Lado de la insignia en píxeles. */
  size?: number;
  className?: string;
}

export function LogoMark({ size = 24, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="48" height="48" rx="13" fill="var(--accent)" />
      <rect x="20" y="9" width="8" height="30" rx="2.5" fill="var(--accent-foreground)" />
      <rect x="9" y="20" width="30" height="8" rx="2.5" fill="var(--accent-foreground)" />
    </svg>
  );
}

interface LogoProps extends LogoMarkProps {
  /** Oculta el texto (sidebar colapsado, barras estrechas). */
  hideWordmark?: boolean;
  /** Tamaño del texto en píxeles. */
  wordmarkSize?: number;
}

export default function Logo({
  size = 24,
  hideWordmark = false,
  wordmarkSize = 13,
  className,
}: LogoProps) {
  return (
    <div className={["flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <LogoMark size={size} className="shrink-0" />
      <span
        className={
          hideWordmark ? "sr-only" : "font-medium tracking-tight text-foreground truncate"
        }
        style={hideWordmark ? undefined : { fontSize: wordmarkSize }}
      >
        MedImaging
      </span>
    </div>
  );
}
