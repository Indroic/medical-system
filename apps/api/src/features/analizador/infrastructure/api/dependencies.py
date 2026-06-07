from collections.abc import AsyncGenerator

from fastapi import Depends
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

import src.shared.infrastructure.database as shared_db
from config import config

from ...application.use_cases.ejecutar_inferencia import EjecutarInferenciaUseCase
from ...domain.services import AnalizadorDomainService
from ..adapters.yolo_adapter import YoloInferenciaAdapter
from ..repositories import AnalisisRepositoryImpl

# Singleton del adaptador YOLO — el modelo se carga una sola vez
_yolo_adapter = YoloInferenciaAdapter(model_path=config.yolo_model_path)


async def get_uow() -> AsyncGenerator[SqlAlchemyUnitOfWork]:
    async with shared_db.async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


async def get_ejecutar_uc(
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> EjecutarInferenciaUseCase:
    repo = AnalisisRepositoryImpl(uow)
    service = AnalizadorDomainService(repo=repo, ia_adapter=_yolo_adapter)
    return EjecutarInferenciaUseCase(service=service, uow=uow)
