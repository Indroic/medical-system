import os
from pathlib import Path

import pytest

from src.features.analizador.domain.ports import IModeloInferenciaAdapter
from src.features.analizador.infrastructure.adapters.yolo_adapter import YoloInferenciaAdapter


@pytest.mark.ia
@pytest.mark.asyncio
async def test_yolo_real_inference():
    """Prueba de integración real que carga el modelo PyTorch/ONNX.
    Se requiere el modelo `models/yolo_tomografia.pt` y una imagen `sample.jpg`.
    Solo se ejecuta con `pytest -m ia`."""
    
    # Esta ruta de modelo podría no existir si es un clon nuevo, en un proyecto real 
    # usaríamos un modelo dummy "yolov8n.pt" pre-descargado para validación de pipeline.
    # Aquí usamos el adaptador real (no el mock).
    
    modelo_path = "yolov8n.pt" # YOLOv8 nano: se descargará auto si no existe
    adapter: IModeloInferenciaAdapter = YoloInferenciaAdapter(model_path=modelo_path)
    
    # Necesitamos una imagen dummy para pasarle a OpenCV
    imagen_dummy = Path("/tmp/sample_yolo.jpg")
    if not imagen_dummy.exists():
        import cv2
        import numpy as np
        # Crear imagen negra de 100x100
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.imwrite(str(imagen_dummy), img)
        
    try:
        hallazgos = await adapter.inferir(str(imagen_dummy))
        
        # Como pasamos una imagen negra a yolo, probablemente devuelva 0 hallazgos,
        # pero validamos que el flujo tensores->OpenCV->Domain no crashea
        assert isinstance(hallazgos, list)
    finally:
        if imagen_dummy.exists():
            os.remove(imagen_dummy)
