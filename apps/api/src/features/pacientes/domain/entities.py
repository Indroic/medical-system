from hexcore.domain.base import BaseEntity

class Paciente(BaseEntity):
    nombre: str
    apellido: str
    fecha_nacimiento: str
    documento_identidad: str
