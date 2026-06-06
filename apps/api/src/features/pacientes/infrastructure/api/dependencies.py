from collections.abc import AsyncGenerator
from fastapi import Depends

from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

import src.shared.infrastructure.database as shared_db

from ...application.use_cases.crear_paciente import CrearPacienteUseCase
from ...application.use_cases.obtener_paciente import ObtenerPacienteUseCase
from ...application.use_cases.listar_pacientes import ListarPacientesUseCase
from ...domain.services import PacienteService
from ..repositories import PacienteRepositoryImpl


async def get_uow() -> AsyncGenerator[SqlAlchemyUnitOfWork, None]:
    async with shared_db.async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


async def get_crear_paciente_uc(
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> CrearPacienteUseCase:
    repo = PacienteRepositoryImpl(uow)
    service = PacienteService(paciente_repo=repo)
    return CrearPacienteUseCase(service=service, uow=uow)


async def get_obtener_paciente_uc(
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> ObtenerPacienteUseCase:
    repo = PacienteRepositoryImpl(uow)
    service = PacienteService(paciente_repo=repo)
    return ObtenerPacienteUseCase(service=service, uow=uow)


async def get_listar_pacientes_uc(
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> ListarPacientesUseCase:
    repo = PacienteRepositoryImpl(uow)
    return ListarPacientesUseCase(repo=repo)
