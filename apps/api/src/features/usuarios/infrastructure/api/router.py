from fastapi import APIRouter, Depends, HTTPException, status

from ...application.dtos import LoginCommand, RegistrarUsuarioCommand, TokenResponse, UserResponse
from ...application.use_cases.autenticar_usuario import AutenticarUsuarioUseCase
from ...application.use_cases.registrar_usuario import RegistrarUsuarioUseCase
from ...domain.exceptions import InvalidCredentialsException, UserAlreadyExistsException
from .dependencies import get_autenticar_uc, get_current_user, get_registrar_uc

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.post(
    "/registrar",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario",
)
async def registrar_usuario(
    command: RegistrarUsuarioCommand,
    use_case: RegistrarUsuarioUseCase = Depends(get_registrar_uc),
) -> UserResponse:
    try:
        return await use_case.execute(command)
    except UserAlreadyExistsException as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Autenticar usuario y obtener JWT",
)
async def login(
    command: LoginCommand,
    use_case: AutenticarUsuarioUseCase = Depends(get_autenticar_uc),
) -> TokenResponse:
    try:
        return await use_case.execute(command)
    except InvalidCredentialsException as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Perfil del usuario autenticado",
)
async def me(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    return current_user
