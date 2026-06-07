from uuid import UUID

from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ...domain.services import PacienteService
from ..dtos import PacienteResponse


class ObtenerPacienteUseCase(UseCase[UUID, PacienteResponse]):
    def __init__(self, service: PacienteService, uow: SqlAlchemyUnitOfWork) -> None:
        self.service = service
        self.uow = uow

    async def execute(self, request: UUID) -> PacienteResponse:
        async with self.uow:
            paciente = await self.service.obtener_paciente(request)

        return PacienteResponse(
            id=paciente.id,
            nombre=paciente.nombre,
            apellido=paciente.apellido,
            fecha_nacimiento=paciente.fecha_nacimiento,
            documento_identidad=paciente.documento_identidad,
        )
