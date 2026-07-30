class ReporteNotFoundException(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"Reporte no encontrado: {identifier}")


class ReporteNoEditableException(Exception):
    """Se intentó modificar un reporte que ya no admite cambios.

    Un reporte aprobado es inmutable: es el documento clínico validado y su
    historial debe poder auditarse sin ambigüedad.
    """

    def __init__(self, estado: str = "") -> None:
        super().__init__(
            f"El reporte está en estado '{estado}' y ya no puede modificarse. "
            f"Sólo se pueden editar reportes pendientes de aprobación."
        )
