class PacienteNotFoundException(Exception):
    def __init__(self, message: str = "Paciente no encontrado"):
        super().__init__(message)


class DocumentoDuplicadoException(Exception):
    def __init__(self, message: str = "Ya existe un paciente con ese documento de identidad"):
        super().__init__(message)
