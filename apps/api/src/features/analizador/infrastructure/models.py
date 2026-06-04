from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy.orm import Mapped, mapped_column


class AnalisisModel(BaseModel):
    """ORM exclusivo del slice `analizador`.
    Los hallazgos se almacenan como JSON serializado en texto."""

    __tablename__ = "analisis"

    estudio_id: Mapped[str] = mapped_column(nullable=False, index=True, unique=True)
    imagen_path: Mapped[str] = mapped_column(nullable=False)
    estado: Mapped[str] = mapped_column(default="PENDIENTE", nullable=False)
    nivel_riesgo: Mapped[str] = mapped_column(default="NO_EVALUADO", nullable=False)
    # Lista de Hallazgo VOs serializada como JSON text
    hallazgos_json: Mapped[str] = mapped_column(default="[]", nullable=False)
