from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String


class PacienteModel(BaseModel):
    __tablename__ = "pacientes"

    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_nacimiento: Mapped[str] = mapped_column(String(50), nullable=False)
    documento_identidad: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
