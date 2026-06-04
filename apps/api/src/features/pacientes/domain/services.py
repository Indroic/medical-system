from .exceptions import DocumentoDuplicadoException
from .repositories import IPacienteRepository


class PacienteService:
    def __init__(self, paciente_repo: IPacienteRepository):
        self.paciente_repo = paciente_repo

    async def validar_documento_unico(self, documento_identidad: str) -> None:
        paciente_existente = await self.paciente_repo.get_by_documento(documento_identidad)
        if paciente_existente:
            raise DocumentoDuplicadoException()
