import asyncio
from typing import override

from ...domain.ports import IModeloInferenciaAdapter
from ...domain.value_objects import CoordenadasBBox, Hallazgo

# Importaciones de IA — opcionales en tiempo de importación para no romper tests
try:
    from ultralytics import YOLO
    import cv2
    import numpy as np
    _YOLO_DISPONIBLE = True
except ImportError:
    _YOLO_DISPONIBLE = False


class YoloInferenciaAdapter(IModeloInferenciaAdapter):
    """Implementa el puerto IModeloInferenciaAdapter usando YOLOv8 (Ultralytics).

    La inferencia se delega a un ThreadPoolExecutor porque PyTorch/YOLO es
    CPU/GPU-bound y bloquearía el event loop de asyncio.
    """

    def __init__(self, model_path: str) -> None:
        self._model_path = model_path
        self._model = None  # Carga perezosa — evita bloquear el startup

    def _cargar_modelo_si_necesario(self) -> None:
        if self._model is None:
            if not _YOLO_DISPONIBLE:
                raise RuntimeError(
                    "ultralytics y/o opencv-python no están instalados. "
                    "Ejecuta: pip install ultralytics opencv-python"
                )
            self._model = YOLO(self._model_path)

    def _ejecutar_inferencia_sync_bytes(self, image_bytes: bytes) -> list[Hallazgo]:
        """Bloque síncrono de CPU. Se ejecuta en un hilo separado."""
        self._cargar_modelo_si_necesario()

        nparr = np.frombuffer(image_bytes, np.uint8)
        imagen = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if imagen is None:
            raise ValueError("OpenCV no pudo decodificar la imagen.")

        resultados = self._model(imagen)[0]
        hallazgos: list[Hallazgo] = []

        for box in resultados.boxes:
            x_min, y_min, x_max, y_max = box.xyxy[0].tolist()
            confianza: float = float(box.conf[0])
            clase_id: int = int(box.cls[0])
            etiqueta: str = resultados.names[clase_id]

            hallazgos.append(
                Hallazgo(
                    etiqueta=etiqueta,
                    confianza=confianza,
                    bbox=CoordenadasBBox(
                        x_min=x_min,
                        y_min=y_min,
                        x_max=x_max,
                        y_max=y_max,
                    ),
                )
            )

        return hallazgos

    @override
    async def inferir(self, imagen_path: str) -> list[Hallazgo]:
        """Corre la inferencia en un hilo del pool para no bloquear asyncio."""
        from src.shared.infrastructure.storage.s3_client import S3StorageAdapter
        
        # 1. Descargamos la imagen asincrónicamente
        storage = S3StorageAdapter()
        file_bytes = await storage.download_file(imagen_path)

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,  # usa el ThreadPoolExecutor por defecto
            self._ejecutar_inferencia_sync_bytes,
            file_bytes,
        )
