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


def _a_uuid(valor: UUID | str) -> UUID:
    """Normaliza a UUID. Las columnas pasaron de String a sa.UUID en la
    migración c4e8a1d5f7b2, pero las entidades y los eventos de dominio pueden
    seguir llegando con cualquiera de las dos formas."""
    return UUID(valor) if isinstance(valor, str) else valor


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
        # `estudio_id`/`analisis_id` ya son UUID nativos en la BD; se mantiene la
        # coerción defensiva para filas creadas antes de la migración c4e8a1d5f7b2.
        async def resolve_estudio_id(m):
            return _a_uuid(m.estudio_id)
        async def resolve_analisis_id(m):
            return _a_uuid(m.analisis_id)
        return {
            "estudio_id": ("estudio_id", resolve_estudio_id),
            "analisis_id": ("analisis_id", resolve_analisis_id)
        }

    @property
    def fields_serializers(self) -> FieldSerializersType | None:
        # Se conserva el UUID: las columnas son sa.UUID y str() rompería el bind.
        return {
            "estudio_id": ("estudio_id", lambda e: _a_uuid(e.estudio_id)),
            "analisis_id": ("analisis_id", lambda e: _a_uuid(e.analisis_id))
        }

    async def get_by_estudio(self, estudio_id: UUID) -> Reporte | None:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(ReporteModel).where(ReporteModel.estudio_id == _a_uuid(estudio_id))
        )
        model = result.scalar_one_or_none()
        if model is None:
            return None
        from hexcore.infrastructure.repositories.utils import to_entity_from_model_or_document
        return await to_entity_from_model_or_document(model, self.entity_cls, self.fields_resolvers)

    async def listar(self, solo_pendientes: bool = False) -> list[Reporte]:
        """Reportes ordenados del más reciente al más antiguo.

        Con `solo_pendientes`, devuelve los que aún admiten edición (todo lo que
        no esté APROBADO), que es la bandeja de trabajo del médico.
        """
        from hexcore.infrastructure.repositories.utils import to_entity_from_model_or_document

        session = self.uow.session  # type: ignore[attr-defined]
        stmt = select(ReporteModel).order_by(ReporteModel.created_at.desc())
        if solo_pendientes:
            stmt = stmt.where(ReporteModel.estado.in_(tuple(Reporte.ESTADOS_EDITABLES)))

        result = await session.execute(stmt)
        return [
            await to_entity_from_model_or_document(
                m, self.entity_cls, self.fields_resolvers
            )
            for m in result.scalars().all()
        ]
