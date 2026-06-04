from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy.orm import Mapped, mapped_column


class UserModel(BaseModel):
    """Modelo ORM exclusivo del slice `usuarios`. Nunca se importa fuera de infrastructure/."""

    __tablename__ = "usuarios"

    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    nombre: Mapped[str] = mapped_column(nullable=False)
    rol: Mapped[str] = mapped_column(default="medico", nullable=False)
