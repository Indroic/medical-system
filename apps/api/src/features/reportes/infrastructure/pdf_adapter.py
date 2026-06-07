import asyncio
import re
import textwrap
from pathlib import Path
from typing import override

from ..domain.ports import IGeneradorPDFAdapter

REPORTS_DIR = Path("reports")

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    _REPORTLAB_DISPONIBLE = True
except ImportError:
    _REPORTLAB_DISPONIBLE = False


class ReportLabPDFAdapter(IGeneradorPDFAdapter):
    """Implementa el puerto IGeneradorPDFAdapter usando ReportLab.
    La generación es CPU-bound, se ejecuta en un hilo separado."""

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

    def _generar_sync(self, reporte, informe_clinico: str | None = None) -> str:
        if not _REPORTLAB_DISPONIBLE:
            raise RuntimeError("reportlab no instalado. Ejecuta: pip install reportlab")

        pdf_path = self._output_dir / f"reporte_{reporte.id}.pdf"
        c = canvas.Canvas(str(pdf_path), pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(72, 750, "Reporte de Analisis de Resonancia Magnetica")
        
        c.setFont("Helvetica", 12)
        c.drawString(72, 720, f"Estudio ID: {reporte.estudio_id}")
        c.drawString(72, 700, f"Nivel de Riesgo: {reporte.nivel_riesgo}")
        c.drawString(72, 680, f"Hallazgos detectados: {reporte.total_hallazgos}")
        
        if informe_clinico:
            c.setFont("Helvetica-Bold", 14)
            c.drawString(72, 640, "Informe Clinico:")
            
            c.setFont("Helvetica", 10)
            textobject = c.beginText()
            textobject.setTextOrigin(72, 620)
            
            texto_limpio = self._strip_markdown(informe_clinico)
            lineas = texto_limpio.split("\n")
            
            for linea in lineas:
                # Envolver texto para no salirse de la página
                wrapped_lines = textwrap.wrap(linea, width=90)
                for wl in wrapped_lines:
                    textobject.textLine(wl)
                if not wrapped_lines:
                    textobject.textLine("") # linea vacía
                    
            c.drawText(textobject)

        c.save()
        return str(pdf_path)

    @override
    async def generar(self, reporte, informe_clinico: str | None = None) -> str:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._generar_sync, reporte, informe_clinico)
