import type { HallazgoDTO } from "@/lib/python-api";

/**
 * Confianza mínima para mostrar una etiqueta. Debe coincidir con
 * `UMBRAL_CONFIANZA_MINIMA` del adaptador YOLO (apps/api …/yolo_adapter.py).
 *
 * El backend ya no guarda detecciones por debajo del umbral, pero los análisis
 * creados antes de ese cambio sí las tienen: sin este filtro seguirían pintando
 * bboxes de baja confianza en el visor y en el PDF.
 */
export const UMBRAL_CONFIANZA = 0.8;

export function esConfiable(hallazgo: HallazgoDTO): boolean {
  return hallazgo.confianza >= UMBRAL_CONFIANZA;
}

/** Hallazgos que superan el umbral, en el orden en que llegaron. */
export function filtrarConfiables(hallazgos: HallazgoDTO[] | undefined): HallazgoDTO[] {
  return (hallazgos ?? []).filter(esConfiable);
}
