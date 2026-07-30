from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy import JSON, ForeignKey, String, UUID as SQLAlchemyUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID


class EstudioModel(BaseModel):
    """ORM exclusivo del slice `estudios`."""

    __tablename__ = "estudios"

    paciente_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID,
        ForeignKey("pacientes.id", name="fk_estudios_paciente_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    imagenes_paths: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    mime_type: Mapped[str] = mapped_column(nullable=False)
    # CUID del usuario de Better-Auth (tabla `user`, propiedad de Drizzle en
    # apps/server). NO lleva ForeignKey a nivel ORM porque `user` no forma parte
    # de Base.metadata — si lo estuviera, Alembic intentaría crear/eliminar una
    # tabla que no le pertenece. La FK se declara a nivel de base de datos en la
    # migración c4e8a1d5f7b2 (ambos backends comparten el mismo Postgres).
    medico_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    estado: Mapped[str] = mapped_column(default="PENDIENTE", nullable=False)

    # ── Relaciones ORM ──────────────────────────────────────────────────────
    # Ver la nota sobre `lazy="raise_on_sql"` en PacienteModel.
    paciente = relationship(
        "PacienteModel",
        back_populates="estudios",
        uselist=False,
        lazy="raise_on_sql",
    )
    # Uno-a-uno: `analisis.estudio_id` tiene índice único.
    analisis = relationship(
        "AnalisisModel",
        back_populates="estudio",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise_on_sql",
    )
    reportes = relationship(
        "ReporteModel",
        back_populates="estudio",
        uselist=True,
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise_on_sql",
    )
