import json
from uuid import UUID

from hexcore.domain.uow import IUnitOfWork
from hexcore.infrastructure.repositories.implementations import (
    SQLAlchemyCommonImplementationsRepo,
)
from hexcore.infrastructure.repositories.utils import to_entity_from_model_or_document
from hexcore.types import FieldResolversType, FieldSerializersType
from sqlalchemy import select

from ..domain.entities import AnalisisResonancia
from ..domain.exceptions import AnalisisNotFoundException
from ..domain.repositories import IAnalisisRepository
from ..domain.value_objects import CoordenadasBBox, Hallazgo
from .models import AnalisisModel


async def _resolver_hallazgos(model: AnalisisModel) -> list[Hallazgo]:
    """Deserializa el JSON de hallazgos de vuelta a Value Objects."""
    raw: list[dict] = json.loads(model.hallazgos_json or "[]")
    return [
        Hallazgo(
            etiqueta=h["etiqueta"],
            confianza=h["confianza"],
            bbox=CoordenadasBBox(
                x_min=h["x_min"],
                y_min=h["y_min"],
                x_max=h["x_max"],
                y_max=h["y_max"],
            ),
            image_index=h.get("image_index", 0),
            # Ausentes en análisis guardados antes de añadir estos campos: 0
            # significa "desconocido" y el visor cae al comportamiento anterior.
            img_width=h.get("img_width", 0),
            img_height=h.get("img_height", 0),
        )
        for h in raw
    ]


def _a_uuid(valor: UUID | str) -> UUID:
    """Normaliza a UUID. `analisis.estudio_id` pasó de String a sa.UUID en la
    migración c4e8a1d5f7b2 para poder declarar la FK contra `estudios.id`."""
    return UUID(valor) if isinstance(valor, str) else valor


async def _resolver_estudio_id(model: AnalisisModel) -> UUID:
    return _a_uuid(model.estudio_id)


class AnalisisRepositoryImpl(
    SQLAlchemyCommonImplementationsRepo[AnalisisResonancia, AnalisisModel],
    IAnalisisRepository,
):
    def __init__(self, uow: IUnitOfWork) -> None:
        super().__init__(uow)

    @property
    def entity_cls(self) -> type[AnalisisResonancia]:
        return AnalisisResonancia

    @property
    def model_cls(self) -> type[AnalisisModel]:
        return AnalisisModel

    @property
    def not_found_exception(self) -> type[Exception]:
        return AnalisisNotFoundException

    @property
    def fields_resolvers(self) -> FieldResolversType | None:
        return {
            "hallazgos": ("hallazgos_json", _resolver_hallazgos),
            "estudio_id": ("estudio_id", _resolver_estudio_id),
        }

    @property
    def fields_serializers(self) -> FieldSerializersType | None:
        return {
            # Se conserva el UUID: la columna es sa.UUID y str() rompería el bind.
            "estudio_id": ("estudio_id", lambda e: _a_uuid(e.estudio_id)),
            "hallazgos": ("hallazgos_json", lambda e: json.dumps(
                [
                    {
                        "etiqueta": h.etiqueta,
                        "confianza": h.confianza,
                        "x_min": h.bbox.x_min,
                        "y_min": h.bbox.y_min,
                        "x_max": h.bbox.x_max,
                        "y_max": h.bbox.y_max,
                        "image_index": h.image_index,
                        "img_width": h.img_width,
                        "img_height": h.img_height,
                    }
                    for h in (e.hallazgos or [])
                ]
            ))
        }

    async def get_by_estudio(self, estudio_id) -> AnalisisResonancia | None:
        session = self.uow.session  # type: ignore[attr-defined]
        result = await session.execute(
            select(AnalisisModel).where(AnalisisModel.estudio_id == _a_uuid(estudio_id))
        )
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return await to_entity_from_model_or_document(model, self.entity_cls, self.fields_resolvers)
