import { useRef, useState } from "react";

import type { HallazgoDTO } from "@/lib/python-api";
import { useImgproxyUrl } from "@/lib/imgproxy";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MriViewerProps {
  imagePaths: string[];
  hallazgos?: HallazgoDTO[];
}

export default function MriViewer({ imagePaths = [], hallazgos = [] }: MriViewerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0, nw: 0, nh: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    setDims({ w: el.naturalWidth, h: el.naturalHeight, nw: el.clientWidth, nh: el.clientHeight });
  };

  const scaleX = dims.nw / (dims.w || 1);
  const scaleY = dims.nh / (dims.h || 1);

  const currentImagePath = imagePaths[currentIndex];
  const proxySrc = useImgproxyUrl(currentImagePath || "", 1000, 1000);
  const currentHallazgos = hallazgos.filter(h => h.image_index === currentIndex);

  const hasNext = currentIndex < imagePaths.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <div className="relative inline-block border border-border rounded-cards overflow-hidden bg-surface">
      <img
        key={currentImagePath}
        ref={imgRef}
        src={proxySrc}
        alt={`Resonancia MRI corte ${currentIndex + 1}`}
        onLoad={handleLoad}
        className="block w-full max-h-[calc(100vh-300px)] object-contain transition-opacity duration-300"
      />
      {dims.nw > 0 && currentHallazgos.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={dims.nw}
          height={dims.nh}
          style={{ width: dims.nw, height: dims.nh }}
        >
          {currentHallazgos.map((h, i) => {
            const x = h.x_min * scaleX;
            const y = h.y_min * scaleY;
            const w = (h.x_max - h.x_min) * scaleX;
            const ht = (h.y_max - h.y_min) * scaleY;
            const stroke = h.es_critico ? "var(--danger)" : "var(--info)";
            const labelText = h.es_critico ? "var(--danger-foreground)" : "var(--info-foreground)";
            return (
              <g key={i}>
                <rect x={x} y={y} width={w} height={ht} fill="none" stroke={stroke} strokeWidth={2} />
                <rect x={x} y={y - 16} width={Math.max(w, 60)} height={16} fill={stroke} />
                <text x={x + 3} y={y - 4} fill={labelText} fontSize={10} fontFamily="Geist Variable, monospace">
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
            onClick={() => setCurrentIndex(i => i - 1)}
            disabled={!hasPrev}
            className="text-foreground disabled:text-muted hover:text-accent transition-colors disabled:pointer-events-none p-1"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-[12px] font-medium text-muted tabular-nums tracking-widest">
            {currentIndex + 1} <span className="text-muted">/</span> {imagePaths.length}
          </div>
          <button
            onClick={() => setCurrentIndex(i => i + 1)}
            disabled={!hasNext}
            className="text-foreground disabled:text-muted hover:text-accent transition-colors disabled:pointer-events-none p-1"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
