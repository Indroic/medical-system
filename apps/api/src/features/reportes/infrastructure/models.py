from datetime import datetime
from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy import DateTime, ForeignKey, String, Text, UUID as SQLAlchemyUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID


class ReporteModel(BaseModel):
    __tablename__ = "reportes"

    # Tipados como UUID nativo (antes String) para poder declarar las FKs.
    estudio_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID,
        ForeignKey("estudios.id", name="fk_reportes_estudio_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    analisis_id: Mapped[UUID] = mapped_column(
        SQLAlchemyUUID,
        ForeignKey("analisis.id", name="fk_reportes_analisis_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nivel_riesgo: Mapped[str] = mapped_column(nullable=False)
    total_hallazgos: Mapped[int] = mapped_column(default=0, nullable=False)
    pdf_path: Mapped[str | None] = mapped_column(nullable=True)
    # GENERANDO | LISTO | FALLIDO | APROBADO (APROBADO es terminal e inmutable)
    estado: Mapped[str] = mapped_column(default="GENERANDO", nullable=False)

    # Observaciones clínicas que el médico añade mientras el reporte está
    # pendiente, más la trazabilidad de quién y cuándo lo aprobó.
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    aprobado_por: Mapped[str | None] = mapped_column(String, nullable=True)
    aprobado_en: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relaciones ORM ──────────────────────────────────────────────────────
    # Ver la nota sobre `lazy="raise_on_sql"` en PacienteModel.
    estudio = relationship(
        "EstudioModel",
        back_populates="reportes",
        uselist=False,
        lazy="raise_on_sql",
    )
    analisis = relationship(
        "AnalisisModel",
        back_populates="reportes",
        uselist=False,
        lazy="raise_on_sql",
    )
