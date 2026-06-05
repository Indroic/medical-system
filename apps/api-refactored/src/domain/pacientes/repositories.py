from __future__ import annotations
import abc
from uuid import UUID

from hexcore.domain.repositories import IBaseRepository
from .entities import Pacientes


class IPacientesRepository(IBaseRepository[Pacientes]):
    """
    Interfaz del repositorio para la entidad Pacientes.
    """
    pass