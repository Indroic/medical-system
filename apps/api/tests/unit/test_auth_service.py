import pytest

from src.features.usuarios.domain.services import AuthService, _hash_password, _verify_password


# Mock repository sincrono/asincrono para testing unitario del servicio
class MockUserRepository:
    async def get_by_id(self, entity_id): pass
    async def get_by_email(self, email): pass
    async def save(self, entity): pass
    async def delete(self, entity): pass


@pytest.mark.asyncio
async def test_auth_service_hashing():
    service = AuthService(user_repo=MockUserRepository())  # type: ignore
    
    password = "MySecurePassword123"
    hashed = _hash_password(password)
    
    assert hashed != password
    
    # Verificar exitosamente
    assert _verify_password(password, hashed) == True
    
    # Verificar falla
    assert _verify_password("WrongPassword", hashed) == False
