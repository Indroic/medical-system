from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

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
            analisis = await self.service.ejecutar_inferencia(
                estudio_id=command.estudio_id,
                imagen_path=command.imagen_path,
            )
            # commit() persiste + despacha AnalisisCompletadoEvent
            # -> el handler de reportes reaccionará de forma asíncrona
            await self.uow.commit()

        hallazgos_dto = [
            HallazgoDTO(
                etiqueta=h.etiqueta,
                confianza=h.confianza,
                x_min=h.bbox.x_min,
                y_min=h.bbox.y_min,
                x_max=h.bbox.x_max,
                y_max=h.bbox.y_max,
                es_critico=h.es_critico(),
            )
            for h in analisis.hallazgos
        ]

        return AnalisisResponse(
            analisis_id=analisis.id,
            estudio_id=analisis.estudio_id,
            estado=analisis.estado,
            nivel_riesgo=analisis.nivel_riesgo,
            hallazgos=hallazgos_dto,
            total_hallazgos=len(hallazgos_dto),
        )
