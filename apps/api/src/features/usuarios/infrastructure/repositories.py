from uuid import UUID

from hexcore.domain.uow import IUnitOfWork
from hexcore.infrastructure.repositories.implementations import (
    SQLAlchemyCommonImplementationsRepo,
)
from hexcore.types import FieldResolversType, FieldSerializersType
from sqlalchemy import select

from ..domain.entities import User
from ..domain.exceptions import UserNotFoundException
from ..domain.repositories import IUserRepository
from .models import UserModel


class UserRepositoryImpl(
    SQLAlchemyCommonImplementationsRepo[User, UserModel],
    IUserRepository,
):
    def __init__(self, uow: IUnitOfWork) -> None:
        super().__init__(uow)

    # ── Propiedades requeridas por Hexcore ──────────────────────────────────

    @property
    def entity_cls(self) -> type[User]:
        return User

    @property
    def model_cls(self) -> type[UserModel]:
        return UserModel

    @property
    def not_found_exception(self) -> type[Exception]:
        return UserNotFoundException

    @property
    def fields_resolvers(self) -> FieldResolversType | None:
        return None

    @property
    def fields_serializers(self) -> FieldSerializersType | None:
        return None

    # ── Query especializado (no reimplementar CRUD base) ────────────────────

    async def get_by_email(self, email: str) -> User | None:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(UserModel).where(UserModel.email == email)
        )
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return await self._to_entity(model)
