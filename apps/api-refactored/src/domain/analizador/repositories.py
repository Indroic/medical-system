from __future__ import annotations
import abc
from uuid import UUID

from hexcore.domain.repositories import IBaseRepository
from .entities import Analizador


class IAnalizadorRepository(IBaseRepository[Analizador]):
    """
    Interfaz del repositorio para la entidad Analizador.
    """
    pass