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
    
    # 1. Crear estudio
    files = {"archivo": ("tomografia_sano.png", b"fake", "image/png")}
    data = {
        "paciente_nombre": "A", "paciente_apellido": "B", 
        "paciente_fecha_nacimiento": "2000-01-01", "paciente_documento": "1"
    }
    resp_upload = await async_client.post("/api/v1/estudios/", headers=headers, data=data, files=files)
    estudio_id = resp_upload.json()["id"]
    imagen_path = resp_upload.json()["imagen_path"]
    
    # 2. Mandar a inferir
    resp_infer = await async_client.post(
        "/api/v1/analisis/",
        headers=headers,
        json={"estudio_id": estudio_id, "imagen_path": imagen_path}
    )
    assert resp_infer.status_code == 201
    
    # El mock YOLO devuelve "tejido_sano" (riesgo BAJO) porque el archivo se llama "tomografia_sano.png"
    infer_data = resp_infer.json()
    assert infer_data["nivel_riesgo"] == "BAJO"
    assert infer_data["total_hallazgos"] == 1
    
    # 3. El handler asincrono (on_analisis_completado) ya debió correr.
    # Consultamos el estado del reporte.
    await asyncio.sleep(0.1) # Breve pausa para asegurar flush del UoW de reporte (si se corrió asíncrono)
    
    resp_reporte = await async_client.get(f"/api/v1/reportes/{estudio_id}", headers=headers)
    assert resp_reporte.status_code == 200
    assert resp_reporte.json()["pdf_disponible"] is True
