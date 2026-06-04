from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String


class EstudioModel(BaseModel):
    """ORM exclusivo del slice `estudios`."""

    __tablename__ = "estudios"

    paciente_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    imagen_path: Mapped[str] = mapped_column(nullable=False)
    mime_type: Mapped[str] = mapped_column(nullable=False)
    medico_id: Mapped[str] = mapped_column(nullable=False, index=True)
    estado: Mapped[str] = mapped_column(default="PENDIENTE", nullable=False)
