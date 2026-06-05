from __future__ import annotations
import typing as t
from hexcore.domain.services import BaseDomainService

class UsuariosService(BaseDomainService):
    """
    Servicio de dominio para el módulo usuarios.
    Orquesta operaciones que no encajan de forma natural en una única entidad.
    """
    def __init__(self):
        # Los repositorios y otros servicios se inyectan aquí.
        pass

    # Define aquí los métodos del servicio