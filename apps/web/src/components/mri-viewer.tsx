import { useRef, useState } from "react";

import type { HallazgoDTO } from "@/lib/python-api";

interface MriViewerProps {
  imagePath: string;
  hallazgos?: HallazgoDTO[];
}

export default function MriViewer({ imagePath, hallazgos = [] }: MriViewerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0, nw: 0, nh: 0 });

  const handleLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    setDims({
      w: el.naturalWidth,
      h: el.naturalHeight,
      nw: el.clientWidth,
      nh: el.clientHeight,
    });
  };

  const scaleX = dims.nw / (dims.w || 1);
  const scaleY = dims.nh / (dims.h || 1);

  return (
    <div className="relative inline-block border border-hairline rounded-[14px] overflow-hidden">
      <img
        ref={imgRef}
        src={imagePath}
        alt="Resonancia MRI"
        onLoad={handleLoad}
        className="block max-h-[480px] w-auto"
      />
      {dims.nw > 0 && hallazgos.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={dims.nw}
          height={dims.nh}
          style={{ width: dims.nw, height: dims.nh }}
        >
          {hallazgos.map((h, i) => {
            const x = h.x_min * scaleX;
            const y = h.y_min * scaleY;
            const w = (h.x_max - h.x_min) * scaleX;
            const ht = (h.y_max - h.y_min) * scaleY;
            const stroke = h.es_critico ? "#0a0a0a" : "#a1a1a1";
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={ht}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={1.5}
                />
                <rect x={x} y={y - 16} width={Math.max(w, 60)} height={16} fill={stroke} />
                <text
                  x={x + 3}
                  y={y - 4}
                  fill="#ffffff"
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
    </div>
  );
}
