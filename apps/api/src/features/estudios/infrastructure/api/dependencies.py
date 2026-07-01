from collections.abc import AsyncGenerator

from fastapi import Depends
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

import src.shared.infrastructure.database as shared_db
from src.shared.infrastructure.storage.s3_client import S3StorageAdapter

from ...application.use_cases.recepcionar_estudio import RecepcionarEstudioUseCase
from ...application.use_cases.subir_imagen_estudio import SubirImagenEstudioUseCase
from ...domain.services import EstudioService
from ..repositories import EstudioRepositoryImpl


async def get_uow() -> AsyncGenerator[SqlAlchemyUnitOfWork]:
    async with shared_db.async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


async def get_recepcionar_uc(
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> RecepcionarEstudioUseCase:
    repo = EstudioRepositoryImpl(uow)
    service = EstudioService(estudio_repo=repo)
    return RecepcionarEstudioUseCase(service=service, uow=uow)


async def get_subir_imagen_uc() -> SubirImagenEstudioUseCase:
    return SubirImagenEstudioUseCase(storage=S3StorageAdapter())
