from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy import JSON, String, UUID as SQLAlchemyUUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID


class EstudioModel(BaseModel):
    """ORM exclusivo del slice `estudios`."""

    __tablename__ = "estudios"

    paciente_id: Mapped[UUID] = mapped_column(SQLAlchemyUUID, nullable=False, index=True)
    imagenes_paths: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    mime_type: Mapped[str] = mapped_column(nullable=False)
    medico_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    estado: Mapped[str] = mapped_column(default="PENDIENTE", nullable=False)
