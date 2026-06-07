from typing import Protocol
from uuid import UUID

from .entities import Reporte


class IReporteRepository(Protocol):
    async def get_by_id(self, entity_id: UUID) -> Reporte: ...
    async def get_by_estudio(self, estudio_id: UUID) -> Reporte | None: ...
    async def save(self, entity: Reporte) -> None: ...


class IGeneradorPDFAdapter(Protocol):
    """Puerto para el generador de PDF. Desacopla ReportLab/WeasyPrint del dominio."""

    async def generar(self, reporte: Reporte, informe_clinico: str | None = None) -> str:
        """Genera el PDF y retorna la ruta del archivo generado."""
        ...
