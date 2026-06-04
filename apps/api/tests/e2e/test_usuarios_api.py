import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_flujo_completo_auth(async_client: AsyncClient):
    # 1. Registro
    reg_data = {
        "email": "medico@hospital.com",
        "password": "SecurePassword123!",
        "nombre": "Dr. House"
    }
    resp = await async_client.post("/api/v1/usuarios/registrar", json=reg_data)
    assert resp.status_code == 201
    
    # Intento de duplicado
    resp_dup = await async_client.post("/api/v1/usuarios/registrar", json=reg_data)
    assert resp_dup.status_code == 409
    
    # 2. Login
    login_data = {"email": "medico@hospital.com", "password": "SecurePassword123!"}
    resp_login = await async_client.post("/api/v1/usuarios/login", json=login_data)
    assert resp_login.status_code == 200
    token = resp_login.json()["access_token"]
    
    # 3. Acceso a /me
    resp_me = await async_client.get(
        "/api/v1/usuarios/me", 
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp_me.status_code == 200
    me_data = resp_me.json()
    assert me_data["email"] == "medico@hospital.com"
