from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ..dtos import CrearPacienteCommand, PacienteResponse
from ...domain.entities import Paciente
from ...domain.services import PacienteService
from ...infrastructure.repositories import PacienteRepositoryImpl


class CrearPacienteUseCase(UseCase[CrearPacienteCommand, PacienteResponse]):
    def __init__(self, service: PacienteService, uow: SqlAlchemyUnitOfWork):
        self.service = service
        self.uow = uow

    async def execute(self, request: CrearPacienteCommand) -> PacienteResponse:
        await self.service.validar_documento_unico(request.documento_identidad)
        
        paciente = Paciente(
            nombre=request.nombre,
            apellido=request.apellido,
            fecha_nacimiento=request.fecha_nacimiento,
            documento_identidad=request.documento_identidad
        )
        
        async with self.uow:
            repo = PacienteRepositoryImpl(self.uow)
            await repo.save(paciente)
            await self.uow.commit()
        
        return PacienteResponse(
            id=paciente.id,
            nombre=paciente.nombre,
            apellido=paciente.apellido,
            fecha_nacimiento=paciente.fecha_nacimiento,
            documento_identidad=paciente.documento_identidad
        )
