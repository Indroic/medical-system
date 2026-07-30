from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class PacienteModel(BaseModel):
    __tablename__ = "pacientes"

    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_nacimiento: Mapped[str] = mapped_column(String(50), nullable=False)
    documento_identidad: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)

    # ── Relaciones ORM ──────────────────────────────────────────────────────
    # Historial de estudios del paciente. El target se declara como string para
    # que SQLAlchemy lo resuelva vía su registry: así no hace falta importar el
    # modelo de otro slice en tiempo de ejecución y se preserva el aislamiento.
    #
    # `lazy="raise_on_sql"` es deliberado: en contexto async un lazy load
    # implícito lanzaría MissingGreenlet en un punto arbitrario. Con esto el
    # fallo es explícito y obliga a cargar la relación con selectinload().
    estudios = relationship(
        "EstudioModel",
        back_populates="paciente",
        uselist=True,
        lazy="raise_on_sql",
        passive_deletes=True,
    )
