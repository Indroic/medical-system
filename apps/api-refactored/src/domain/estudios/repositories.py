from __future__ import annotations
import abc
from uuid import UUID

from hexcore.domain.repositories import IBaseRepository
from .entities import Estudios


class IEstudiosRepository(IBaseRepository[Estudios]):
    """
    Interfaz del repositorio para la entidad Estudios.
    """
    pass