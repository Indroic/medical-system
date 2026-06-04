from uuid import UUID
from pydantic import BaseModel, Field


class CrearPacienteCommand(BaseModel):
    nombre: str = Field(..., min_length=2)
    apellido: str = Field(..., min_length=2)
    fecha_nacimiento: str
    documento_identidad: str


class PacienteResponse(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    fecha_nacimiento: str
    documento_identidad: str
