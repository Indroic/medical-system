import asyncio
from typing import override

from ...domain.ports import IModeloInferenciaAdapter
from ...domain.value_objects import CoordenadasBBox, Hallazgo

# Importaciones de IA — opcionales en tiempo de importación para no romper tests
try:
    import io
    import cv2
    import numpy as np
    import pydicom
    from ultralytics import YOLO
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

    def _ejecutar_inferencia_sync_bytes(self, image_bytes: bytes, image_index: int = 0) -> list[Hallazgo]:
        """Bloque síncrono de CPU. Se ejecuta en un hilo separado."""
        self._cargar_modelo_si_necesario()

        imagen = None
        try:
            # 1. Intentar decodificar como DICOM médico (.dcm)
            dicom_dataset = pydicom.dcmread(io.BytesIO(image_bytes))
            pixel_array = dicom_dataset.pixel_array
            
            # Normalizar los píxeles (usualmente 12 o 16 bit) a 8-bit (0-255)
            img_normalized = cv2.normalize(pixel_array, None, 0, 255, cv2.NORM_MINMAX)
            img_8bit = np.uint8(img_normalized)
            
            # YOLO espera imágenes BGR (RGB invertido en OpenCV)
            if len(img_8bit.shape) == 2:
                imagen = cv2.cvtColor(img_8bit, cv2.COLOR_GRAY2BGR)
            else:
                imagen = img_8bit
        except pydicom.errors.InvalidDicomError:
            # 2. Fallback a decodificación clásica de PNG/JPEG
            nparr = np.frombuffer(image_bytes, np.uint8)
            imagen = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if imagen is None:
            raise ValueError("No se pudo decodificar la imagen. No es un DICOM válido ni un PNG/JPEG reconocido.")

        # Dimensiones de la imagen tal como la ve YOLO: las coordenadas que
        # devuelve `box.xyxy` están en este espacio, no en el de la miniatura
        # que sirve imgproxy. Se propagan al hallazgo para que el visor pueda
        # reescalar el bbox correctamente.
        img_height, img_width = imagen.shape[:2]

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
                    image_index=image_index,
                    img_width=int(img_width),
                    img_height=int(img_height),
                )
            )

        return hallazgos

    @override
    async def inferir(self, imagen_path: str, image_index: int = 0) -> list[Hallazgo]:
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
            image_index,
        )
