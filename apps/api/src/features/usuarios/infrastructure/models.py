from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy.orm import Mapped, mapped_column


class UserModel(BaseModel):
    """Modelo ORM exclusivo del slice `usuarios`. Nunca se importa fuera de infrastructure/.

    NOTA SOBRE LA INTEGRIDAD REFERENCIAL (importante)
    -------------------------------------------------
    Esta tabla NO es la fuente de verdad de identidad del sistema en runtime.
    La autenticación real la resuelve Better-Auth sobre la tabla `user`
    (gestionada por Drizzle en apps/server, en el MISMO Postgres), y
    `get_current_user` construye el usuario a partir del claim `sub` del JWT de
    Better-Auth — que es un CUID de texto, no el UUID de esta tabla.

    Por eso `estudios.medico_id` es String (ver migración b1f3c9a7d2e4) y su
    ForeignKey apunta a `user.id`, no a `usuarios.id`: declarar aquí una FK
    contra `usuarios.id` fallaría en cuanto se insertara cualquier estudio,
    porque los IDs que llegan no existen en esta tabla.

    `usuarios` sobrevive únicamente para el flujo de login propio de la API
    (AutenticarUsuarioUseCase / RegistrarUsuarioUseCase), que el frontend ya no
    usa. Si se decide unificar la identidad en una sola tabla, esa migración es
    un trabajo aparte y con movimiento de datos.
    """

    __tablename__ = "usuarios"

    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    nombre: Mapped[str] = mapped_column(nullable=False)
    rol: Mapped[str] = mapped_column(default="medico", nullable=False)
