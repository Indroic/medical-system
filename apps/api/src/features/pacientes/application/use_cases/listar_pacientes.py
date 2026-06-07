from hexcore.application.use_cases.base import UseCase

from ...domain.repositories import IPacienteRepository
from ..dtos import PacienteListResponse, PacienteResponse


class ListarPacientesUseCase(UseCase[None, PacienteListResponse]):
    def __init__(self, repo: IPacienteRepository) -> None:
        self.repo = repo

    async def execute(self, params: None = None) -> PacienteListResponse:
        pacientes = await self.repo.get_all()
        items = [
            PacienteResponse(
                id=p.id,
                nombre=p.nombre,
                apellido=p.apellido,
                fecha_nacimiento=p.fecha_nacimiento,
                documento_identidad=p.documento_identidad,
            )
            for p in pacientes
        ]
        return PacienteListResponse(items=items, total=len(items))
