from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy.orm import Mapped, mapped_column


class EstudioModel(BaseModel):
    """ORM exclusivo del slice `estudios`. El Value Object Paciente
    se serializa como JSON en una columna de texto."""

    __tablename__ = "estudios"

    paciente_json: Mapped[str] = mapped_column(nullable=False)
    imagen_path: Mapped[str] = mapped_column(nullable=False)
    mime_type: Mapped[str] = mapped_column(nullable=False)
    medico_id: Mapped[str] = mapped_column(nullable=False, index=True)
    estado: Mapped[str] = mapped_column(default="PENDIENTE", nullable=False)
