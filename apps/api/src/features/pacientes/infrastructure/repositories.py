from uuid import UUID

from hexcore.domain.uow import IUnitOfWork
from hexcore.infrastructure.repositories.implementations import (
    SQLAlchemyCommonImplementationsRepo,
)
from hexcore.types import FieldResolversType, FieldSerializersType
from sqlalchemy import select

from ..domain.entities import Paciente
from ..domain.exceptions import PacienteNotFoundException
from ..domain.repositories import IPacienteRepository
from .models import PacienteModel


class PacienteRepositoryImpl(
    SQLAlchemyCommonImplementationsRepo[Paciente, PacienteModel],
    IPacienteRepository,
):
    def __init__(self, uow: IUnitOfWork) -> None:
        super().__init__(uow)

    @property
    def entity_cls(self) -> type[Paciente]:
        return Paciente

    @property
    def model_cls(self) -> type[PacienteModel]:
        return PacienteModel

    @property
    def not_found_exception(self) -> type[Exception]:
        return PacienteNotFoundException

    @property
    def fields_resolvers(self) -> FieldResolversType | None:
        return None

    @property
    def fields_serializers(self) -> FieldSerializersType | None:
        return None

    async def get_by_documento(self, documento_identidad: str) -> Paciente | None:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(PacienteModel).where(PacienteModel.documento_identidad == documento_identidad)
        )
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return await self._to_entity(model)

    async def get_all(self) -> list[Paciente]:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(PacienteModel).order_by(PacienteModel.created_at.desc())
        )
        models = result.scalars().all()
        return [await self._to_entity(model) for model in models]
