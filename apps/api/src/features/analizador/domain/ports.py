from typing import Protocol

from .value_objects import Hallazgo


class IModeloInferenciaAdapter(Protocol):
    """Puerto de IA. El dominio solo conoce esta abstracción.
    La infraestructura (YOLO, mock, otro modelo) implementa este contrato."""

    async def inferir(self, imagen_path: str) -> list[Hallazgo]:
        """Ejecuta la inferencia sobre la imagen y retorna los hallazgos detectados."""
        ...
