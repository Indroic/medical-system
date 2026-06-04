from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ...domain.services import AuthService
from ..dtos import RegistrarUsuarioCommand, UserResponse


class RegistrarUsuarioUseCase(UseCase[RegistrarUsuarioCommand, UserResponse]):
    def __init__(self, service: AuthService, uow: SqlAlchemyUnitOfWork) -> None:
        self.service = service
        self.uow = uow

    async def execute(self, command: RegistrarUsuarioCommand) -> UserResponse:
        async with self.uow:
            user = await self.service.registrar_usuario(
                email=command.email,
                password=command.password,
                nombre=command.nombre,
                rol=command.rol,
            )
            # commit() persiste y despacha UserRegistradoEvent automáticamente
            await self.uow.commit()

        return UserResponse(
            id=user.id,
            email=user.email,
            nombre=user.nombre,
            rol=user.rol,
            is_active=user.is_active,
        )
