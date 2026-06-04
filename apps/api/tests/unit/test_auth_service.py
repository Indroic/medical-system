import pytest

from src.features.usuarios.domain.exceptions import InvalidCredentialsException
from src.features.usuarios.domain.services import AuthService


# Mock repository sincrono/asincrono para testing unitario del servicio
class MockUserRepository:
    async def get_by_email(self, email: str):
        return None


@pytest.mark.asyncio
async def test_auth_service_hashing():
    service = AuthService(user_repo=MockUserRepository())  # type: ignore
    
    password = "MySecurePassword123"
    hashed = service.hash_password(password)
    
    assert hashed != password
    
    # Verificar exitosamente
    service.verify_password(password, hashed)
    
    # Verificar falla
    with pytest.raises(InvalidCredentialsException):
        service.verify_password("WrongPassword", hashed)
