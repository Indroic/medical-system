import { useEffect, useState } from "react";

import { filtrarConfiables } from "@/lib/hallazgos";
import { buildImgproxyUrl } from "@/lib/imgproxy";
import type { HallazgoDTO } from "@/lib/python-api";

/**
 * Rasteriza los cortes del estudio con los bounding boxes y las etiquetas ya
 * dibujados encima, para poder incrustarlos en el PDF.
 *
 * @react-pdf/renderer no dibuja SVG sobre una imagen con la geometría que
 * necesitamos (el visor lo hace midiendo el DOM), así que se compone en un
 * `<canvas>` y se entrega un PNG en data URI, que sí acepta `<Image>`.
 */

/** Lado máximo del PNG anotado. Suficiente para imprimir a media página. */
const LADO_MAXIMO = 900;

/** Colores fijos: el PDF no puede resolver variables CSS del tema. */
const COLOR_CRITICO = "#dc2626";
const COLOR_NORMAL = "#0284c7";

export interface ImagenAnotada {
  /** Índice del corte dentro de `imagenes_paths`. */
  index: number;
  /** PNG en data URI, con los bboxes y etiquetas ya pintados. */
  dataUrl: string;
  /** Hallazgos dibujados en este corte (ya filtrados por confianza). */
  hallazgos: HallazgoDTO[];
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Necesario para que el canvas no quede "tainted" si imgproxy se sirve
    // desde otro origen; en mismo origen es inocuo.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

function dibujarEtiqueta(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  color: string,
  escalaTexto: number,
) {
  const alturaFuente = Math.max(11, Math.round(13 * escalaTexto));
  ctx.font = `bold ${alturaFuente}px Helvetica, Arial, sans-serif`;

  const anchoTexto = ctx.measureText(texto).width;
  const paddingX = 4;
  const altoCaja = alturaFuente + 6;

  // La etiqueta va encima del bbox salvo que no quepa: entonces entra por
  // dentro, para no recortarse contra el borde superior de la imagen.
  const yCaja = y - altoCaja >= 0 ? y - altoCaja : y;

  ctx.fillStyle = color;
  ctx.fillRect(x, yCaja, anchoTexto + paddingX * 2, altoCaja);

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, x + paddingX, yCaja + altoCaja / 2);
}

async function anotarCorte(
  imagePath: string,
  index: number,
  hallazgos: HallazgoDTO[],
): Promise<ImagenAnotada | null> {
  try {
    const url = await buildImgproxyUrl(imagePath, LADO_MAXIMO, LADO_MAXIMO);
    const img = await cargarImagen(url);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);

    for (const h of hallazgos) {
      // Los bboxes están en píxeles de la imagen ORIGINAL; aquí se trabaja
      // sobre la versión reducida por imgproxy, así que hay que reescalar.
      const origW = h.img_width || img.naturalWidth;
      const origH = h.img_height || img.naturalHeight;
      const fx = canvas.width / (origW || 1);
      const fy = canvas.height / (origH || 1);

      const x = h.x_min * fx;
      const y = h.y_min * fy;
      const w = (h.x_max - h.x_min) * fx;
      const alto = (h.y_max - h.y_min) * fy;

      const color = h.es_critico ? COLOR_CRITICO : COLOR_NORMAL;
      const escalaTexto = canvas.width / 600;

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, Math.round(2.5 * escalaTexto));
      ctx.strokeRect(x, y, w, alto);

      dibujarEtiqueta(
        ctx,
        `${h.etiqueta} ${Math.round(h.confianza * 100)}%`,
        x,
        y,
        color,
        escalaTexto,
      );
    }

    return { index, dataUrl: canvas.toDataURL("image/png"), hallazgos };
  } catch (err) {
    // Un corte que no se puede rasterizar (red, CORS, canvas bloqueado) no debe
    // impedir descargar el reporte: se omite y el resto del PDF se genera.
    console.error("No se pudo anotar el corte", index, err);
    return null;
  }
}

export async function anotarImagenes(
  imagePaths: string[],
  hallazgos: HallazgoDTO[],
): Promise<ImagenAnotada[]> {
  const confiables = filtrarConfiables(hallazgos);

  const resultados = await Promise.all(
    imagePaths.map((path, index) =>
      anotarCorte(
        path,
        index,
        confiables.filter((h) => h.image_index === index),
      ),
    ),
  );

  return resultados.filter((r): r is ImagenAnotada => r !== null);
}

/**
 * Versión hook: anota los cortes en cuanto hay datos y expone el resultado
 * para pasárselo a `ReportePDFDocument`.
 */
export function useImagenesAnotadas(
  imagePaths: string[] | undefined,
  hallazgos: HallazgoDTO[] | undefined,
) {
  // La clave identifica la entrada ya procesada. Las props llegan como arrays
  // nuevos en cada render, así que compararlas por identidad relanzaría la
  // rasterización en bucle; y guardar la clave junto al resultado permite saber
  // si lo que hay en memoria corresponde a los datos actuales — sin eso habría
  // un render en el que el PDF se ofrece todavía sin imágenes.
  const clave = `${(imagePaths ?? []).join("|")}::${JSON.stringify(hallazgos ?? [])}`;

  const [estado, setEstado] = useState<{ clave: string; imagenes: ImagenAnotada[] }>({
    clave: "",
    imagenes: [],
  });

  useEffect(() => {
    if (!imagePaths || imagePaths.length === 0) {
      setEstado({ clave, imagenes: [] });
      return;
    }

    let cancelado = false;

    anotarImagenes(imagePaths, hallazgos ?? []).then((imagenes) => {
      if (!cancelado) setEstado({ clave, imagenes });
    });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return {
    imagenes: estado.clave === clave ? estado.imagenes : [],
    cargando: estado.clave !== clave,
  };
}
