from uuid import UUID

from hexcore.domain.uow import IUnitOfWork
from hexcore.infrastructure.repositories.implementations import (
    SQLAlchemyCommonImplementationsRepo,
)
from hexcore.types import FieldResolversType, FieldSerializersType
from sqlalchemy import select

from ..domain.entities import Reporte
from ..domain.exceptions import ReporteNotFoundException
from ..domain.ports import IReporteRepository
from .models import ReporteModel


class ReporteRepositoryImpl(
    SQLAlchemyCommonImplementationsRepo[Reporte, ReporteModel],
    IReporteRepository,
):
    def __init__(self, uow: IUnitOfWork) -> None:
        super().__init__(uow)

    @property
    def entity_cls(self) -> type[Reporte]:
        return Reporte

    @property
    def model_cls(self) -> type[ReporteModel]:
        return ReporteModel

    @property
    def not_found_exception(self) -> type[Exception]:
        return ReporteNotFoundException

    @property
    def fields_resolvers(self) -> FieldResolversType | None:
        return None

    @property
    def fields_serializers(self) -> FieldSerializersType | None:
        return None

    async def get_by_estudio(self, estudio_id: UUID) -> Reporte | None:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(ReporteModel).where(ReporteModel.estudio_id == str(estudio_id))
        )
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return await self._to_entity(model)
