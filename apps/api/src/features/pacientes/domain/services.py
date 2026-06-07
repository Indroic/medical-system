from datetime import date
from uuid import UUID

from hexcore.domain.services import BaseDomainService

from .entities import Paciente
from .exceptions import DocumentoDuplicadoException
from .repositories import IPacienteRepository


class PacienteService(BaseDomainService):
    def __init__(self, paciente_repo: IPacienteRepository) -> None:
        self.paciente_repo = paciente_repo
        super().__init__()

    async def crear_paciente(
        self,
        nombre: str,
        apellido: str,
        fecha_nacimiento: date,
        documento_identidad: str,
    ) -> Paciente:
        existente = await self.paciente_repo.get_by_documento(documento_identidad)
        if existente is not None:
            raise DocumentoDuplicadoException()
        paciente = Paciente(
            nombre=nombre,
            apellido=apellido,
            fecha_nacimiento=fecha_nacimiento,
            documento_identidad=documento_identidad,
        )
        await self.paciente_repo.save(paciente)
        return paciente

    async def obtener_paciente(self, paciente_id: UUID) -> Paciente:
        return await self.paciente_repo.get_by_id(paciente_id)
