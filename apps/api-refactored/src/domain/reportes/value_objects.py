from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from decimal import Decimal


# Ejemplo de Objeto de Valor
# class MiObjetoDeValor(BaseModel):
#     """
#     Un Objeto de Valor (Value Object) de ejemplo.
#     Son inmutables y se definen por sus atributos.
#     """
#     valor: str
#
#     model_config = ConfigDict(frozen=True)