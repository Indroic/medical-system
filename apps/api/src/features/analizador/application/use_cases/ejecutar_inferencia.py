from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ...domain.entities import AnalisisResonancia
from ...domain.services import AnalizadorDomainService
from ..dtos import AnalisisResponse, EjecutarInferenciaCommand, HallazgoDTO


class EjecutarInferenciaUseCase(UseCase[EjecutarInferenciaCommand, AnalisisResponse]):
    def __init__(
        self,
        service: AnalizadorDomainService,
        uow: SqlAlchemyUnitOfWork,
    ) -> None:
        self.service = service
        self.uow = uow

    async def execute(self, command: EjecutarInferenciaCommand) -> AnalisisResponse:
        async with self.uow:
            analisis = await self.service.iniciar_inferencia(
                estudio_id=command.estudio_id,
                imagen_path=command.imagen_path,
            )
            await self.uow.commit()

        # Encolar la tarea asíncrona
        from src.features.analizador.application.tasks import procesar_estudio_ia
        procesar_estudio_ia.delay(str(command.estudio_id), command.imagen_path)

        return AnalisisResponse(
            analisis_id=analisis.id,
            estudio_id=analisis.estudio_id,
            estado=analisis.estado,
            nivel_riesgo=analisis.nivel_riesgo,
            hallazgos=[],
            total_hallazgos=0,
        )
