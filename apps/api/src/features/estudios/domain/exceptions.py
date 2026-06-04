class EstudioNotFoundException(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"Estudio no encontrado: {identifier}")


class TipoArchivoNoPermitidoException(Exception):
    TIPOS_PERMITIDOS = {"image/dicom", "image/png", "image/jpeg", "application/dicom"}

    def __init__(self, mime_type: str) -> None:
        super().__init__(
            f"Tipo de archivo no permitido: '{mime_type}'. "
            f"Tipos aceptados: {self.TIPOS_PERMITIDOS}"
        )
