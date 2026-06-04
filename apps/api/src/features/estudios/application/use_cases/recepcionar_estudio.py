from hexcore.application.use_cases.base import UseCase
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ...domain.services import EstudioService
from ...domain.value_objects import Paciente
from ..dtos import EstudioResponse, RecepcionarEstudioCommand


class RecepcionarEstudioUseCase(UseCase[RecepcionarEstudioCommand, EstudioResponse]):
    def __init__(
        self,
        service: EstudioService,
        uow: SqlAlchemyUnitOfWork,
        archivo_nombre: str,
        archivo_contenido: bytes,
        mime_type: str,
    ) -> None:
        self.service = service
        self.uow = uow
        # Los binarios del archivo se reciben aquí porque no caben en un DTO serializable
        self._archivo_nombre = archivo_nombre
        self._archivo_contenido = archivo_contenido
        self._mime_type = mime_type

    async def execute(self, command: RecepcionarEstudioCommand) -> EstudioResponse:
        paciente = Paciente(
            nombre=command.paciente_nombre,
            apellido=command.paciente_apellido,
            fecha_nacimiento=command.paciente_fecha_nacimiento,
            documento_identidad=command.paciente_documento,
        )

        async with self.uow:
            estudio = await self.service.recepcionar_estudio(
                paciente=paciente,
                nombre_archivo=self._archivo_nombre,
                contenido=self._archivo_contenido,
                mime_type=self._mime_type,
                medico_id=command.medico_id,
            )
            await self.uow.commit()

        return EstudioResponse(
            id=estudio.id,
            paciente_nombre_completo=estudio.paciente.nombre_completo,
            imagen_path=estudio.imagen_path,
            mime_type=estudio.mime_type,
            estado=estudio.estado,
            medico_id=estudio.medico_id,
        )
