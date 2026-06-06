from uuid import UUID

from hexcore.application.dtos.base import DTO


# ── Comandos (Entrada) ──────────────────────────────────────────────────────

class RegistrarUsuarioCommand(DTO):
    email: str
    password: str
    nombre: str
    rol: str = "medico"


class LoginCommand(DTO):
    email: str
    password: str


# ── Respuestas (Salida) ─────────────────────────────────────────────────────

class UserResponse(DTO):
    id: str
    email: str
    nombre: str
    rol: str
    is_active: bool


class TokenResponse(DTO):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
