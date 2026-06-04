from uuid import UUID
from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ..dtos import PacienteResponse
from ...domain.exceptions import PacienteNotFoundException
from ...infrastructure.repositories import PacienteRepositoryImpl


class ObtenerPacienteUseCase(UseCase[UUID, PacienteResponse]):
    def __init__(self, uow: SqlAlchemyUnitOfWork):
        self.uow = uow

    async def execute(self, request: UUID) -> PacienteResponse:
        async with self.uow:
            repo = PacienteRepositoryImpl(self.uow)
            paciente = await repo.get_by_id(request)
        
        if not paciente:
            raise PacienteNotFoundException()
            
        return PacienteResponse(
            id=paciente.id,
            nombre=paciente.nombre,
            apellido=paciente.apellido,
            fecha_nacimiento=paciente.fecha_nacimiento,
            documento_identidad=paciente.documento_identidad
        )
