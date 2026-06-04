class AnalisisNotFoundException(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"Analisis no encontrado: {identifier}")


class ImagenNoAccesibleException(Exception):
    def __init__(self, path: str) -> None:
        super().__init__(f"No se puede acceder a la imagen en: {path}")
