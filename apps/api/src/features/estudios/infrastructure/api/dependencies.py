from collections.abc import AsyncGenerator

from fastapi import Depends, UploadFile
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

import src.shared.infrastructure.database as shared_db
from src.shared.infrastructure.storage.s3_client import S3StorageAdapter

from ...application.use_cases.recepcionar_estudio import RecepcionarEstudioUseCase
from ...domain.services import EstudioService
from ..repositories import EstudioRepositoryImpl


async def get_uow() -> AsyncGenerator[SqlAlchemyUnitOfWork]:
    async with shared_db.async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


async def get_recepcionar_uc(
    archivos: list[UploadFile],
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> RecepcionarEstudioUseCase:
    archivos_data = []
    for archivo in archivos:
        contenido = await archivo.read()
        archivos_data.append({
            "nombre_archivo": archivo.filename or "imagen",
            "contenido": contenido,
            "mime_type": archivo.content_type or "application/octet-stream",
        })

    storage = S3StorageAdapter()
    repo = EstudioRepositoryImpl(uow)
    service = EstudioService(estudio_repo=repo, storage=storage)
    return RecepcionarEstudioUseCase(
        service=service,
        uow=uow,
        archivos=archivos_data,
    )
