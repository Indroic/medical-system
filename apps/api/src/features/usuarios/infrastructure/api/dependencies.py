import asyncio
from collections.abc import AsyncGenerator

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork
from jwt import PyJWKClient

from config import config

from ...application.dtos import UserResponse
from ...application.use_cases.autenticar_usuario import AutenticarUsuarioUseCase
from ...application.use_cases.registrar_usuario import RegistrarUsuarioUseCase
from ...domain.services import AuthService
from ..repositories import UserRepositoryImpl

import src.shared.infrastructure.database as shared_db

security = HTTPBearer()

# Singleton JWKS client — obtiene las public keys de Better-Auth una sola vez y las cachea
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(
            f"{config.server_url}/api/auth/jwks",
            cache_jwk_set=True,
            lifespan=3600,  # rota las keys una vez por hora
        )
    return _jwks_client


async def get_uow() -> AsyncGenerator[SqlAlchemyUnitOfWork, None]:
    async with shared_db.async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


async def get_registrar_uc(
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> RegistrarUsuarioUseCase:
    repo = UserRepositoryImpl(uow)
    service = AuthService(user_repo=repo)
    return RegistrarUsuarioUseCase(service=service, uow=uow)


async def get_autenticar_uc(
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> AutenticarUsuarioUseCase:
    repo = UserRepositoryImpl(uow)
    service = AuthService(user_repo=repo)
    return AutenticarUsuarioUseCase(
        service=service,
        uow=uow,
        secret_key=config.secret_key,
        algorithm=config.algorithm,
        expire_minutes=config.access_token_expire_minutes,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserResponse:
    """Verifica el JWT de Better-Auth localmente usando las public keys JWKS."""
    token = credentials.credentials
    try:
        client = _get_jwks_client()
        # PyJWKClient usa urllib internamente (síncrono) — lo corremos en thread pool
        signing_key = await asyncio.to_thread(client.get_signing_key_from_jwt, token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA", "ES256", "RS256"],
            audience="https://medicalserver.indroic.dev",
            issuer="https://medicalserver.indroic.dev",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"Error decodificando JWT: {repr(e)}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # El JWT payload de Better-Auth spreads el objeto user directamente:
    # { id, name, email, emailVerified, role, sub, iat, ... }
    return UserResponse(
        id=payload.get("sub", payload.get("id", "")),
        email=payload.get("email", ""),
        nombre=payload.get("name", ""),
        rol=payload.get("role", "medico"),
        is_active=True,
    )
