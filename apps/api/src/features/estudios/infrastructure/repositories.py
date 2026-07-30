from uuid import UUID

from hexcore.domain.uow import IUnitOfWork
from hexcore.infrastructure.repositories.implementations import (
    SQLAlchemyCommonImplementationsRepo,
)
from hexcore.infrastructure.repositories.utils import to_entity_from_model_or_document
from hexcore.types import FieldResolversType, FieldSerializersType
from sqlalchemy import select, text

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

    async def list_by_medico(self, medico_id: str) -> list[Estudio]:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(EstudioModel)
            .where(EstudioModel.medico_id == medico_id)
            .order_by(EstudioModel.created_at.desc())
        )
        models = result.scalars().all()
        return [await to_entity_from_model_or_document(m, self.entity_cls, self.fields_resolvers) for m in models]

    async def list_by_paciente(self, paciente_id: UUID) -> list[Estudio]:
        """Historial completo de estudios de un paciente.

        A propósito NO filtra por médico: el expediente clínico de un paciente
        incluye los estudios subidos por cualquier profesional.
        """
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(EstudioModel)
            .where(EstudioModel.paciente_id == paciente_id)
            .order_by(EstudioModel.created_at.desc())
        )
        models = result.scalars().all()
        return [await to_entity_from_model_or_document(m, self.entity_cls, self.fields_resolvers) for m in models]


class PacienteLookupAdapter:
    """Implementa `IPacienteLookup` con una consulta de existencia directa.

    Se consulta la tabla por nombre en vez de importar `PacienteModel`: así el
    slice `estudios` no depende del ORM de `pacientes` en tiempo de ejecución.
    """

    def __init__(self, uow: IUnitOfWork) -> None:
        self._uow = uow

    async def existe(self, paciente_id: UUID) -> bool:
        session = self._uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            text("SELECT 1 FROM pacientes WHERE id = :paciente_id LIMIT 1"),
            {"paciente_id": str(paciente_id)},
        )
        return result.first() is not None
