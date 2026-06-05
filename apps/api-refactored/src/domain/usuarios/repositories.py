from __future__ import annotations
import abc
from uuid import UUID

from hexcore.domain.repositories import IBaseRepository
from .entities import Usuarios


class IUsuariosRepository(IBaseRepository[Usuarios]):
    """
    Interfaz del repositorio para la entidad Usuarios.
    """
    pass