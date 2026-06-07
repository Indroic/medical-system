from typing import Protocol

from .value_objects import Hallazgo


class IModeloInferenciaAdapter(Protocol):
    """Puerto de IA. El dominio solo conoce esta abstracción.
    La infraestructura (YOLO, mock, otro modelo) implementa este contrato."""

    async def inferir(self, imagen_path: str, image_index: int = 0) -> list[Hallazgo]:
        """Ejecuta la inferencia sobre la imagen y retorna los hallazgos detectados."""
        ...


class ILLMAdapter(Protocol):
    """Puerto para el modelo secundario (LLM) que procesa datos crudos."""

    async def generar_reporte_clinico(self, hallazgos: list[Hallazgo]) -> str:
        """Genera un reporte clínico estructurado en Markdown basado en los hallazgos crudos."""
        ...
