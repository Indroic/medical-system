from pathlib import Path
from typing import override

from src.features.analizador.domain.ports import IModeloInferenciaAdapter
from src.features.analizador.domain.value_objects import CoordenadasBBox, Hallazgo
from src.features.estudios.domain.services import IArchivoStorageAdapter
from src.features.reportes.domain.ports import IGeneradorPDFAdapter


class MockYoloAdapter(IModeloInferenciaAdapter):
    """Simulador de YOLO que devuelve hallazgos predecibles para testing E2E."""
    
    @override
    async def inferir(self, imagen_path: str) -> list[Hallazgo]:
        if "sano" in imagen_path.lower():
            return [
                Hallazgo(
                    etiqueta="tejido_sano",
                    confianza=0.99,
                    bbox=CoordenadasBBox(x_min=0.0, y_min=0.0, x_max=100.0, y_max=100.0)
                )
            ]
        return [
            Hallazgo(
                etiqueta="tumor",
                confianza=0.95,
                bbox=CoordenadasBBox(x_min=10.0, y_min=20.0, x_max=50.0, y_max=60.0)
            )
        ]


class MockPDFAdapter(IGeneradorPDFAdapter):
    @override
    async def generar(self, reporte) -> str:
        return f"/mock/reports/reporte_{reporte.id}.pdf"


class MockStorageAdapter(IArchivoStorageAdapter):
    @override
    async def guardar(self, nombre_archivo: str, contenido: bytes) -> str:
        path = f"/tmp/{nombre_archivo}"
        Path(path).write_bytes(contenido)
        return path
