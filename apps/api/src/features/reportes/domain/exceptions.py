class ReporteNotFoundException(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"Reporte no encontrado: {identifier}")
