from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy.orm import Mapped, mapped_column


class ReporteModel(BaseModel):
    __tablename__ = "reportes"

    estudio_id: Mapped[str] = mapped_column(nullable=False, index=True)
    analisis_id: Mapped[str] = mapped_column(nullable=False)
    nivel_riesgo: Mapped[str] = mapped_column(nullable=False)
    total_hallazgos: Mapped[int] = mapped_column(default=0, nullable=False)
    pdf_path: Mapped[str | None] = mapped_column(nullable=True)
    estado: Mapped[str] = mapped_column(default="GENERANDO", nullable=False)
