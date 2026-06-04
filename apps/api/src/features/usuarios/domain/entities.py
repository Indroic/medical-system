from hexcore.domain.base import BaseEntity

from .events import UserRegistradoEvent


class User(BaseEntity):
    """Entidad de dominio. id, created_at, updated_at, is_active
    son provistos por BaseEntity — no se redeclaran."""

    email: str
    hashed_password: str
    nombre: str
    rol: str = "medico"  # "medico" | "admin"

    def registrar(self) -> None:
        """Comportamiento de dominio: emite el evento de creación."""
        self.register_event(
            UserRegistradoEvent(entity_id=self.id, email=self.email)
        )
