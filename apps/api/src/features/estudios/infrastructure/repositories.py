from hexcore.infrastructure.repositories.utils import to_entity_from_model_or_document
from hexcore.domain.uow import IUnitOfWork
from hexcore.infrastructure.repositories.implementations import (
    SQLAlchemyCommonImplementationsRepo,
)
from hexcore.types import FieldResolversType, FieldSerializersType
from sqlalchemy import select
from uuid import UUID

from ..domain.entities import Estudio
from ..domain.exceptions import EstudioNotFoundException
from ..domain.repositories import IEstudioRepository
from .models import EstudioModel

class EstudioRepositoryImpl(
    SQLAlchemyCommonImplementationsRepo[Estudio, EstudioModel],
    IEstudioRepository,
):
    def __init__(self, uow: IUnitOfWork) -> None:
        super().__init__(uow)

    @property
    def entity_cls(self) -> type[Estudio]:
        return Estudio

    @property
    def model_cls(self) -> type[EstudioModel]:
        return EstudioModel

    @property
    def not_found_exception(self) -> type[Exception]:
        return EstudioNotFoundException

    @property
    def fields_resolvers(self) -> FieldResolversType | None:
        async def resolve_paciente_id(m):
            return UUID(m.paciente_id) if isinstance(m.paciente_id, str) else m.paciente_id
        return {"paciente_id": ("paciente_id", resolve_paciente_id)}

    @property
    def fields_serializers(self) -> FieldSerializersType | None:
        return {
            "paciente_id": ("paciente_id", lambda e: str(e.paciente_id))
        }

    async def list_by_medico(self, medico_id: str) -> list[Estudio]:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(EstudioModel).where(EstudioModel.medico_id == medico_id)
        )
        models = result.scalars().all()
        return [await to_entity_from_model_or_document(m, self.entity_cls, self.fields_resolvers) for m in models]
