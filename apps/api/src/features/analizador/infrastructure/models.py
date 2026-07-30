from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy import JSON, ForeignKey, Text, UUID as SQLAlchemyUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID


class AnalisisModel(BaseModel):
    """ORM exclusivo del slice `analizador`.
    Los hallazgos se almacenan como JSON serializado en texto."""

    __tablename__ = "analisis"

    # Tipado como UUID nativo (antes era String con UUIDs serializados) para
    # poder declarar la FK contra `estudios.id`, que también es UUID.
    estudio_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID,
        ForeignKey("estudios.id", name="fk_analisis_estudio_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
    )
    imagenes_paths: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    estado: Mapped[str] = mapped_column(default="PENDIENTE", nullable=False)
    nivel_riesgo: Mapped[str] = mapped_column(default="NO_EVALUADO", nullable=False)
    # Lista de Hallazgo VOs serializada como JSON text
    hallazgos_json: Mapped[str] = mapped_column(default="[]", nullable=False)
    informe_avanzado_ia: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relaciones ORM ──────────────────────────────────────────────────────
    # Ver la nota sobre `lazy="raise_on_sql"` en PacienteModel.
    estudio = relationship(
        "EstudioModel",
        back_populates="analisis",
        uselist=False,
        lazy="raise_on_sql",
    )
    reportes = relationship(
        "ReporteModel",
        back_populates="analisis",
        uselist=True,
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise_on_sql",
    )
