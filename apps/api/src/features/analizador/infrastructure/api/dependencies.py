from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import Depends
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from config import config
from src.features.usuarios.application.dtos import UserResponse
from src.features.usuarios.infrastructure.api.dependencies import get_current_user
from src.shared.infrastructure.database import async_session_factory

from ...application.use_cases.ejecutar_inferencia import EjecutarInferenciaUseCase
from ...domain.services import AnalizadorDomainService
from ..adapters.yolo_adapter import YoloInferenciaAdapter
from ..repositories import AnalisisRepositoryImpl

# Singleton del adaptador YOLO — el modelo se carga una sola vez
_yolo_adapter = YoloInferenciaAdapter(model_path=config.yolo_model_path)


async def get_uow() -> AsyncGenerator[SqlAlchemyUnitOfWork, None]:
    async with async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


async def get_ejecutar_uc(
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> EjecutarInferenciaUseCase:
    repo = AnalisisRepositoryImpl(uow)
    service = AnalizadorDomainService(repo=repo, ia_adapter=_yolo_adapter)
    return EjecutarInferenciaUseCase(service=service, uow=uow)
