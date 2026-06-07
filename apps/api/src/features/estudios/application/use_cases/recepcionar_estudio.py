from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ...domain.services import EstudioService
from ..dtos import EstudioResponse, RecepcionarEstudioCommand


class RecepcionarEstudioUseCase(UseCase[RecepcionarEstudioCommand, EstudioResponse]):
    def __init__(
        self,
        service: EstudioService,
        uow: SqlAlchemyUnitOfWork,
        archivos: list[dict],
    ) -> None:
        self.service = service
        self.uow = uow
        self._archivos = archivos

    async def execute(self, command: RecepcionarEstudioCommand) -> EstudioResponse:
        async with self.uow:
            estudio = await self.service.recepcionar_estudio(
                paciente_id=command.paciente_id,
                archivos=self._archivos,
                medico_id=command.medico_id,
            )
            await self.uow.commit()

        return EstudioResponse(
            id=estudio.id,
            paciente_id=estudio.paciente_id,
            imagenes_paths=estudio.imagenes_paths,
            mime_type=estudio.mime_type,
            estado=estudio.estado,
            medico_id=estudio.medico_id,
        )
