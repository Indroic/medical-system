import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_subir_estudio_multipart(async_client: AsyncClient):
    # Setup: registrar un usuario y loguearse para tener token
    reg_data = {"email": "doc@test.com", "password": "Pass", "nombre": "Doc"}
    await async_client.post("/api/v1/usuarios/registrar", json=reg_data)
    resp_login = await async_client.post("/api/v1/usuarios/login", json=reg_data)
    token = resp_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Subir estudio (simular archivo Dicom/PNG)
    file_content = b"fake-png-content"
    files = {"archivo": ("tomografia_sano.png", file_content, "image/png")}
    data = {
        "paciente_nombre": "Ana",
        "paciente_apellido": "Gomez",
        "paciente_fecha_nacimiento": "1990-05-10",
        "paciente_documento": "98765432"
    }
    
    resp_upload = await async_client.post("/api/v1/estudios/", headers=headers, data=data, files=files)
    assert resp_upload.status_code == 201
    
    upload_data = resp_upload.json()
    assert upload_data["paciente_nombre_completo"] == "Ana Gomez"
    assert upload_data["estado"] == "PENDIENTE"
    
    # Verificar listar estudios
    resp_list = await async_client.get("/api/v1/estudios/", headers=headers)
    assert resp_list.status_code == 200
    assert resp_list.json()["total"] == 1
