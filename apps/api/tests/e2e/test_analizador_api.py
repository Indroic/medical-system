import pytest
import asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_flujo_inferencia_y_reporte(async_client: AsyncClient):
    # Setup
    reg_data = {"email": "ai@test.com", "password": "Pass", "nombre": "AI Doc"}
    await async_client.post("/api/v1/usuarios/registrar", json=reg_data)
    resp_login = await async_client.post("/api/v1/usuarios/login", json=reg_data)
    token = resp_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Crear un paciente
    paciente_data = {
        "nombre": "Pedro",
        "apellido": "Gomez",
        "fecha_nacimiento": "1990-05-10",
        "documento_identidad": "2"
    }
    resp_pac = await async_client.post("/api/v1/pacientes/", headers=headers, json=paciente_data)
    paciente_id = resp_pac.json()["id"]

    # 1. Crear estudio
    files = {"archivo": ("tomografia_sano.png", b"fake", "image/png")}
    data = {
        "paciente_id": paciente_id
    }
    resp_upload = await async_client.post("/api/v1/estudios/", headers=headers, data=data, files=files)
    estudio_id = resp_upload.json()["id"]
    imagen_path = resp_upload.json()["imagen_path"]
    
    # 2. Mandar a inferir
    from src.features.analizador.domain.events import AnalisisCompletadoEvent
    from src.features.reportes.application.handlers import on_analisis_completado
    from config import config
    config.event_dispatcher.subscribe(AnalisisCompletadoEvent, on_analisis_completado)
    
    resp_infer = await async_client.post(
        "/api/v1/analisis/",
        headers=headers,
        json={"estudio_id": estudio_id, "imagen_path": imagen_path}
    )
    assert resp_infer.status_code == 201
    
    # El mock YOLO devuelve "tejido_sano" (riesgo MODERADO porque confianza > 0.7)
    infer_data = resp_infer.json()
    assert infer_data["nivel_riesgo"] == "MODERADO"
    assert infer_data["total_hallazgos"] == 1
    
    # 3. El handler asincrono (on_analisis_completado) ya debió correr.
    # Consultamos el estado del reporte con retries.
    resp_reporte = None
    for _ in range(10):
        await asyncio.sleep(0.2)
        resp_reporte = await async_client.get(f"/api/v1/reportes/{estudio_id}", headers=headers)
        if resp_reporte.status_code == 200:
            break
            
    assert resp_reporte is not None
    assert resp_reporte.status_code == 200
    assert resp_reporte.json()["pdf_disponible"] is True
