from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ..dtos import CrearPacienteCommand, PacienteResponse
from ...domain.services import PacienteService


class CrearPacienteUseCase(UseCase[CrearPacienteCommand, PacienteResponse]):
    def __init__(self, service: PacienteService, uow: SqlAlchemyUnitOfWork) -> None:
        self.service = service
        self.uow = uow

    async def execute(self, request: CrearPacienteCommand) -> PacienteResponse:
        async with self.uow:
            paciente = await self.service.crear_paciente(
                nombre=request.nombre,
                apellido=request.apellido,
                fecha_nacimiento=request.fecha_nacimiento,
                documento_identidad=request.documento_identidad,
            )
            await self.uow.commit()

        return PacienteResponse(
            id=paciente.id,
            nombre=paciente.nombre,
            apellido=paciente.apellido,
            fecha_nacimiento=paciente.fecha_nacimiento,
            documento_identidad=paciente.documento_identidad,
        )
