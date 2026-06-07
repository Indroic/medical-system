from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column


class EstudioModel(BaseModel):
    """ORM exclusivo del slice `estudios`."""

    __tablename__ = "estudios"

    paciente_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    imagenes_paths: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    mime_type: Mapped[str] = mapped_column(nullable=False)
    medico_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    estado: Mapped[str] = mapped_column(default="PENDIENTE", nullable=False)
