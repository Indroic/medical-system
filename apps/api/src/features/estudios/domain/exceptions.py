class EstudioNotFoundException(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"Estudio no encontrado: {identifier}")


class PacienteInexistenteException(Exception):
    """El estudio referencia un paciente que no existe.

    Antes de que existiera la FK `fk_estudios_paciente_id` esto se insertaba sin
    protestar y dejaba el estudio huérfano. Ahora se valida en el dominio para
    devolver un 404 legible en vez de un IntegrityError en el commit.
    """

    def __init__(self, paciente_id: str = "") -> None:
        super().__init__(f"El paciente {paciente_id} no existe.")


class TipoArchivoNoPermitidoException(Exception):
    TIPOS_PERMITIDOS = {"image/dicom", "image/png", "image/jpeg", "application/dicom"}

    def __init__(self, mime_type: str) -> None:
        super().__init__(
            f"Tipo de archivo no permitido: '{mime_type}'. "
            f"Tipos aceptados: {self.TIPOS_PERMITIDOS}"
        )
