from __future__ import annotations
import abc
from uuid import UUID

from hexcore.domain.repositories import IBaseRepository
from .entities import Reportes


class IReportesRepository(IBaseRepository[Reportes]):
    """
    Interfaz del repositorio para la entidad Reportes.
    """
    pass