from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from config import config

from ...application.dtos import UserResponse
from ...application.use_cases.autenticar_usuario import AutenticarUsuarioUseCase
from ...application.use_cases.registrar_usuario import RegistrarUsuarioUseCase
from ...domain.services import AuthService
from ..repositories import UserRepositoryImpl

# ── Sesión de base de datos ─────────────────────────────────────────────────
from src.shared.infrastructure.database import async_session_factory

security = HTTPBearer()


async def get_uow() -> AsyncGenerator[SqlAlchemyUnitOfWork, None]:
    async with async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


# ── Factories de Use Cases ──────────────────────────────────────────────────

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


# ── Guard de autenticación ──────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> UserResponse:
    """Decodifica el JWT y devuelve el UserResponse del usuario autenticado."""
    token = credentials.credentials
    try:
        import jwt

        payload = jwt.decode(token, config.secret_key, algorithms=[config.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ValueError
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    async with uow:
        from uuid import UUID

        from ..repositories import UserRepositoryImpl

        repo = UserRepositoryImpl(uow)
        user = await repo.get_by_id(UUID(user_id))

    return UserResponse(
        id=user.id,
        email=user.email,
        nombre=user.nombre,
        rol=user.rol,
        is_active=user.is_active,
    )
