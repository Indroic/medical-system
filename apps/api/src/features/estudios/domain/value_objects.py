from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Paciente:
    """Value Object inmutable que representa la identidad del paciente.
    No tiene ID propio — es atributo del Estudio."""

    nombre: str
    apellido: str
    fecha_nacimiento: str  # ISO 8601: YYYY-MM-DD
    documento_identidad: str

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellido}"
