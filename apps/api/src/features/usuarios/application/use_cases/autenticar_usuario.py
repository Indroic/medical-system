import datetime

from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ...domain.services import AuthService
from ..dtos import LoginCommand, TokenResponse, UserResponse

try:
    import jwt  # PyJWT
except ImportError:
    jwt = None  # type: ignore[assignment]


def _crear_token(user_id: str, secret: str, algorithm: str, expire_minutes: int) -> str:
    if jwt is None:
        # Fallback sin jwt instalado (dev sin deps)
        return f"dev-token-{user_id}"
    payload = {
        "sub": user_id,
        "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=expire_minutes),
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


class AutenticarUsuarioUseCase(UseCase[LoginCommand, TokenResponse]):
    def __init__(
        self,
        service: AuthService,
        uow: SqlAlchemyUnitOfWork,
        secret_key: str,
        algorithm: str,
        expire_minutes: int,
    ) -> None:
        self.service = service
        self.uow = uow
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.expire_minutes = expire_minutes

    async def execute(self, command: LoginCommand) -> TokenResponse:
        # La autenticación es de solo lectura — no hay commit necesario
        async with self.uow:
            user = await self.service.autenticar(
                email=command.email,
                password=command.password,
            )

        token = _crear_token(
            str(user.id), self.secret_key, self.algorithm, self.expire_minutes
        )

        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                nombre=user.nombre,
                rol=user.rol,
                is_active=user.is_active,
            ),
        )
