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
        async def resolve_estudio_id(m):
            return UUID(m.estudio_id) if isinstance(m.estudio_id, str) else m.estudio_id
        async def resolve_analisis_id(m):
            return UUID(m.analisis_id) if isinstance(m.analisis_id, str) else m.analisis_id
        return {
            "estudio_id": ("estudio_id", resolve_estudio_id),
            "analisis_id": ("analisis_id", resolve_analisis_id)
        }

    @property
    def fields_serializers(self) -> FieldSerializersType | None:
        return {
            "estudio_id": ("estudio_id", lambda e: str(e.estudio_id)),
            "analisis_id": ("analisis_id", lambda e: str(e.analisis_id))
        }

    async def get_by_estudio(self, estudio_id: UUID) -> Reporte | None:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(ReporteModel).where(ReporteModel.estudio_id == str(estudio_id))
        )
        model = result.scalar_one_or_none()
        if model is None:
            return None
        from hexcore.infrastructure.repositories.utils import to_entity_from_model_or_document
        return await to_entity_from_model_or_document(model, self.entity_cls, self.fields_resolvers)
