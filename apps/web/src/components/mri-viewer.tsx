import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { HallazgoDTO } from "@/lib/python-api";
import { esConfiable } from "@/lib/hallazgos";
import { useImgproxyUrl } from "@/lib/imgproxy";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MriViewerProps {
  imagePaths: string[];
  hallazgos?: HallazgoDTO[];
  /** Alto máximo del área de imagen. Distinto en página completa y en modal. */
  maxHeightClassName?: string;
}

/** Geometría del contenido realmente pintado dentro del `<img>`. */
interface Geometria {
  /** Tamaño de la caja del elemento. */
  boxW: number;
  boxH: number;
  /** Tamaño del contenido pintado (menor que la caja si hay letterbox). */
  renderW: number;
  renderH: number;
  /** Desplazamiento del contenido dentro de la caja (centrado por object-contain). */
  offsetX: number;
  offsetY: number;
  /** Dimensiones intrínsecas de la imagen servida (ya redimensionada). */
  natW: number;
  natH: number;
}

const GEOMETRIA_VACIA: Geometria = {
  boxW: 0, boxH: 0, renderW: 0, renderH: 0, offsetX: 0, offsetY: 0, natW: 0, natH: 0,
};

export default function MriViewer({
  imagePaths = [],
  hallazgos = [],
  maxHeightClassName = "max-h-[calc(100vh-300px)]",
}: MriViewerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [geo, setGeo] = useState<Geometria>(GEOMETRIA_VACIA);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentImagePath = imagePaths[currentIndex];
  const proxySrc = useImgproxyUrl(currentImagePath || "", 1000, 1000);
  // Sólo se etiqueta lo que supera el umbral de confianza (ver lib/hallazgos).
  const currentHallazgos = hallazgos.filter(
    (h) => h.image_index === currentIndex && esConfiable(h),
  );

  // Si cambia la lista de imágenes, volver al primer corte y no dejar el índice
  // apuntando fuera de rango.
  useEffect(() => {
    setCurrentIndex((i) => (i < imagePaths.length ? i : 0));
  }, [imagePaths.length]);

  /**
   * Calcula dónde queda pintada la imagen dentro del elemento.
   *
   * `object-contain` escala el contenido para que quepa en la caja preservando
   * la proporción y lo centra, así que la zona pintada casi nunca coincide con
   * la caja: hay bandas (letterbox) en uno de los dos ejes. Dibujar el SVG
   * sobre `inset-0` sin tener esto en cuenta desplaza todos los bboxes.
   */
  const medir = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;

    const natW = el.naturalWidth;
    const natH = el.naturalHeight;
    const boxW = el.clientWidth;
    const boxH = el.clientHeight;
    if (!natW || !natH || !boxW || !boxH) return;

    const escala = Math.min(boxW / natW, boxH / natH);
    const renderW = natW * escala;
    const renderH = natH * escala;

    setGeo({
      boxW,
      boxH,
      renderW,
      renderH,
      offsetX: (boxW - renderW) / 2,
      offsetY: (boxH - renderH) / 2,
      natW,
      natH,
    });
  }, []);

  // Remedir cuando cambia el tamaño del contenedor (resize de ventana, colapso
  // del sidebar, apertura de un modal…). Sin esto los bboxes se quedaban
  // clavados a la escala del primer render.
  useLayoutEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    medir();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(medir);
    observer.observe(el);
    return () => observer.disconnect();
  }, [medir, proxySrc]);

  const hasNext = currentIndex < imagePaths.length - 1;
  const hasPrev = currentIndex > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" && hasPrev) {
      e.preventDefault();
      setCurrentIndex((i) => i - 1);
    } else if (e.key === "ArrowRight" && hasNext) {
      e.preventDefault();
      setCurrentIndex((i) => i + 1);
    }
  };

  if (imagePaths.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-cards border border-border bg-surface min-h-[320px] text-[13px] text-muted">
        Sin imágenes disponibles
      </div>
    );
  }

  return (
    <div
      className="relative inline-block border border-border rounded-cards overflow-hidden bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      tabIndex={imagePaths.length > 1 ? 0 : undefined}
      onKeyDown={handleKeyDown}
      role={imagePaths.length > 1 ? "group" : undefined}
      aria-label={
        imagePaths.length > 1
          ? `Visor de cortes, ${imagePaths.length} imágenes. Usa las flechas izquierda y derecha.`
          : undefined
      }
    >
      <img
        key={currentImagePath}
        ref={imgRef}
        src={proxySrc}
        alt={`Resonancia MRI corte ${currentIndex + 1} de ${imagePaths.length}`}
        onLoad={medir}
        className={`block w-full ${maxHeightClassName} object-contain transition-opacity duration-300`}
      />

      {geo.renderW > 0 && currentHallazgos.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={geo.boxW}
          height={geo.boxH}
          style={{ width: geo.boxW, height: geo.boxH }}
          aria-hidden="true"
        >
          {currentHallazgos.map((h, i) => {
            // Los bboxes vienen en píxeles de la imagen ORIGINAL, mientras que
            // aquí se muestra la versión reducida por imgproxy. Se escala con
            // las dimensiones originales; si el análisis es anterior a
            // img_width/img_height (0), se cae a las intrínsecas, que es el
            // comportamiento antiguo y sólo acierta si no hubo reducción.
            const origW = h.img_width || geo.natW;
            const origH = h.img_height || geo.natH;
            const fx = geo.renderW / (origW || 1);
            const fy = geo.renderH / (origH || 1);

            const x = geo.offsetX + h.x_min * fx;
            const y = geo.offsetY + h.y_min * fy;
            const w = (h.x_max - h.x_min) * fx;
            const ht = (h.y_max - h.y_min) * fy;

            const stroke = h.es_critico ? "var(--danger)" : "var(--info)";
            const labelText = h.es_critico
              ? "var(--danger-foreground)"
              : "var(--info-foreground)";

            // La etiqueta va encima del bbox salvo que no quepa: entonces se
            // coloca por dentro para que no se recorte en el borde superior.
            const labelY = y - 16 >= geo.offsetY ? y - 16 : y;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={ht}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2}
                />
                <rect x={x} y={labelY} width={Math.max(w, 60)} height={16} fill={stroke} />
                <text
                  x={x + 3}
                  y={labelY + 12}
                  fill={labelText}
                  fontSize={10}
                  fontFamily="Geist Variable, monospace"
                >
                  {h.etiqueta} {Math.round(h.confianza * 100)}%
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* Controles de Navegación del Carrusel */}
      {imagePaths.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={!hasPrev}
            aria-label="Corte anterior"
            className="text-foreground disabled:text-muted hover:text-accent transition-colors disabled:pointer-events-none p-1"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-[12px] font-medium text-muted tabular-nums tracking-widest">
            {currentIndex + 1} <span className="text-muted">/</span> {imagePaths.length}
          </div>
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            disabled={!hasNext}
            aria-label="Corte siguiente"
            className="text-foreground disabled:text-muted hover:text-accent transition-colors disabled:pointer-events-none p-1"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
