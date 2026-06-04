import json

from hexcore.domain.uow import IUnitOfWork
from hexcore.infrastructure.repositories.implementations import (
    SQLAlchemyCommonImplementationsRepo,
)
from hexcore.types import FieldResolversType, FieldSerializersType
from sqlalchemy import select

from ..domain.entities import Estudio
from ..domain.exceptions import EstudioNotFoundException
from ..domain.repositories import IEstudioRepository
from ..domain.value_objects import Paciente
from .models import EstudioModel


async def _resolver_paciente(model: "EstudioModel") -> Paciente:
    """FieldResolver: deserializa el JSON de paciente al Value Object."""
    data = json.loads(model.paciente_json)
    return Paciente(**data)


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
        return {"paciente": _resolver_paciente}

    @property
    def fields_serializers(self) -> FieldSerializersType | None:
        return {
            "paciente_json": lambda e: json.dumps(
                {
                    "nombre": e.paciente.nombre,
                    "apellido": e.paciente.apellido,
                    "fecha_nacimiento": e.paciente.fecha_nacimiento,
                    "documento_identidad": e.paciente.documento_identidad,
                }
            )
        }

    async def list_by_medico(self, medico_id: str) -> list[Estudio]:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(EstudioModel).where(EstudioModel.medico_id == medico_id)
        )
        models = result.scalars().all()
        return [await self._to_entity(m) for m in models]
