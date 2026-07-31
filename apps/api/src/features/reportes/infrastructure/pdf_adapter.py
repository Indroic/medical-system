import asyncio
import re
import textwrap
from pathlib import Path
from typing import override

from ..domain.ports import IGeneradorPDFAdapter

REPORTS_DIR = Path("reports")

# Azul hospitalario de marca (mismo valor que el logo del frontend).
_AZUL = (0.0, 0.369, 0.722)

# Aviso de validez: el documento no es un diagnóstico hasta que un médico lo
# valide y lo firme. Sin acentos porque las fuentes base de ReportLab usan
# WinAnsi y el texto se dibuja tal cual.
_AVISO_VALIDEZ = (
    "Este informe solo es valido si es revisado, validado y firmado por un medico. "
    "Sin esa validacion su contenido es preliminar y no constituye un diagnostico."
)

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    _REPORTLAB_DISPONIBLE = True
except ImportError:
    _REPORTLAB_DISPONIBLE = False


class ReportLabPDFAdapter(IGeneradorPDFAdapter):
    """Implementa el puerto IGeneradorPDFAdapter usando ReportLab.
    La generación es CPU-bound, se ejecuta en un hilo separado."""

    # Geometría de la página (LETTER: 612 x 792 pt).
    _MARGEN_X = 72
    _ANCHO = 612
    _TOPE_SUPERIOR = 750
    _TOPE_INFERIOR = 95

    def __init__(self, output_dir: Path = REPORTS_DIR) -> None:
        self._output_dir = output_dir
        self._output_dir.mkdir(parents=True, exist_ok=True)

    def _strip_markdown(self, text: str) -> str:
        # Remover bold, italic
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        text = re.sub(r'\*(.*?)\*', r'\1', text)
        # Remover headers
        text = re.sub(r'#+\s*(.*)', r'\1', text)
        # Remover links
        text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
        # Remover backticks
        text = re.sub(r'`(.*?)`', r'\1', text)
        return text.strip()

    def _dibujar_cabecera(self, c) -> float:
        """Marca + título. Devuelve la Y donde puede continuar el contenido."""
        y = self._TOPE_SUPERIOR

        # Insignia: cuadrado azul con cruz blanca (versión mínima del logo).
        c.setFillColorRGB(*_AZUL)
        c.roundRect(self._MARGEN_X, y - 4, 22, 22, 5, stroke=0, fill=1)
        c.setFillColorRGB(1, 1, 1)
        c.rect(self._MARGEN_X + 9.5, y + 0.5, 3, 13, stroke=0, fill=1)
        c.rect(self._MARGEN_X + 4.5, y + 5.5, 13, 3, stroke=0, fill=1)

        c.setFillColorRGB(*_AZUL)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(self._MARGEN_X + 30, y + 8, "MedImaging")
        c.setFillColorRGB(0.42, 0.45, 0.5)
        c.setFont("Helvetica", 7.5)
        c.drawString(self._MARGEN_X + 30, y - 1, "Unidad de Diagnostico por Imagen")

        c.setFillColorRGB(0.12, 0.16, 0.22)
        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(self._ANCHO - self._MARGEN_X, y + 8, "INFORME RADIOLOGICO DE ESTUDIO")

        c.setStrokeColorRGB(*_AZUL)
        c.setLineWidth(1.5)
        c.line(self._MARGEN_X, y - 12, self._ANCHO - self._MARGEN_X, y - 12)

        return y - 34

    def _dibujar_aviso_validez(self, c, y: float) -> float:
        """Caja de advertencia: el informe no vale sin validación médica."""
        ancho = self._ANCHO - self._MARGEN_X * 2
        alto = 46

        c.setFillColorRGB(1.0, 0.98, 0.92)
        c.setStrokeColorRGB(0.96, 0.62, 0.04)
        c.setLineWidth(1)
        c.roundRect(self._MARGEN_X, y - alto, ancho, alto, 4, stroke=1, fill=1)

        c.setFillColorRGB(0.57, 0.25, 0.05)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(
            self._MARGEN_X + 8,
            y - 16,
            "PENDIENTE DE VALIDACION MEDICA - SIN VALIDEZ CLINICA",
        )

        c.setFillColorRGB(0.29, 0.33, 0.39)
        c.setFont("Helvetica", 7.5)
        texto_y = y - 28
        for linea in textwrap.wrap(_AVISO_VALIDEZ, width=105):
            c.drawString(self._MARGEN_X + 8, texto_y, linea)
            texto_y -= 9

        return y - alto - 20

    def _dibujar_pie(self, c) -> None:
        """Pie con el aviso de validez y el número de página, en cada hoja."""
        c.setStrokeColorRGB(0.9, 0.91, 0.92)
        c.setLineWidth(0.5)
        c.line(self._MARGEN_X, 72, self._ANCHO - self._MARGEN_X, 72)

        c.setFillColorRGB(0.61, 0.64, 0.69)
        c.setFont("Helvetica", 6.5)
        y = 62
        for linea in textwrap.wrap(f"* {_AVISO_VALIDEZ}", width=120):
            c.drawString(self._MARGEN_X, y, linea)
            y -= 8

        c.drawRightString(self._ANCHO - self._MARGEN_X, 62, f"Pag. {c.getPageNumber()}")

    def _nueva_pagina(self, c) -> float:
        """Cierra la hoja actual y devuelve la Y inicial de la siguiente."""
        self._dibujar_pie(c)
        c.showPage()
        return self._dibujar_cabecera(c)

    def _generar_sync(self, reporte, informe_clinico: str | None = None) -> str:
        if not _REPORTLAB_DISPONIBLE:
            raise RuntimeError("reportlab no instalado. Ejecuta: pip install reportlab")

        pdf_path = self._output_dir / f"reporte_{reporte.id}.pdf"
        c = canvas.Canvas(str(pdf_path), pagesize=letter)

        y = self._dibujar_cabecera(c)
        y = self._dibujar_aviso_validez(c, y)

        c.setFillColorRGB(0.12, 0.16, 0.22)
        c.setFont("Helvetica", 10)
        for etiqueta, valor in (
            ("Estudio ID", str(reporte.estudio_id)),
            ("Nivel de riesgo", str(reporte.nivel_riesgo)),
            ("Hallazgos detectados", str(reporte.total_hallazgos)),
        ):
            c.drawString(self._MARGEN_X, y, f"{etiqueta}: {valor}")
            y -= 18

        if informe_clinico:
            y -= 8
            c.setFont("Helvetica-Bold", 12)
            c.drawString(self._MARGEN_X, y, "Informe radiologico")
            y -= 18

            c.setFont("Helvetica", 10)
            texto_limpio = self._strip_markdown(informe_clinico)

            for linea in texto_limpio.split("\n"):
                # Envolver texto para no salirse de la página. La lista vacía se
                # sustituye por [""] para conservar los saltos de línea.
                for wl in textwrap.wrap(linea, width=90) or [""]:
                    if y < self._TOPE_INFERIOR:
                        y = self._nueva_pagina(c)
                        c.setFillColorRGB(0.12, 0.16, 0.22)
                        c.setFont("Helvetica", 10)
                    c.drawString(self._MARGEN_X, y, wl)
                    y -= 13

        # Espacio para la firma del médico que valida el informe.
        if y < self._TOPE_INFERIOR + 70:
            y = self._nueva_pagina(c)

        y -= 26
        c.setStrokeColorRGB(0.6, 0.64, 0.69)
        c.setLineWidth(0.8)
        c.line(self._MARGEN_X, y, self._MARGEN_X + 220, y)
        c.setFillColorRGB(0.42, 0.45, 0.5)
        c.setFont("Helvetica", 7.5)
        c.drawString(self._MARGEN_X, y - 11, "Nombre, firma y sello del medico")
        c.drawString(self._MARGEN_X, y - 23, "Fecha: ____ / ____ / ________")

        self._dibujar_pie(c)
        c.save()
        return str(pdf_path)

    @override
    async def generar(self, reporte, informe_clinico: str | None = None) -> str:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._generar_sync, reporte, informe_clinico)
