from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import Depends, Form, HTTPException, UploadFile, status
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from src.features.usuarios.application.dtos import UserResponse
from src.features.usuarios.infrastructure.api.dependencies import get_current_user
from src.shared.infrastructure.database import async_session_factory

from ...application.dtos import EstudioResponse, EstudioListResponse
from ...application.use_cases.recepcionar_estudio import RecepcionarEstudioUseCase
from ...domain.exceptions import EstudioNotFoundException, TipoArchivoNoPermitidoException
from ...domain.services import EstudioService
from ..repositories import EstudioRepositoryImpl
from ..storage import LocalStorageAdapter


async def get_uow() -> AsyncGenerator[SqlAlchemyUnitOfWork, None]:
    async with async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


async def get_recepcionar_uc(
    archivo: UploadFile,
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> RecepcionarEstudioUseCase:
    contenido = await archivo.read()
    storage = LocalStorageAdapter()
    repo = EstudioRepositoryImpl(uow)
    service = EstudioService(estudio_repo=repo, storage=storage)
    return RecepcionarEstudioUseCase(
        service=service,
        uow=uow,
        archivo_nombre=archivo.filename or "imagen",
        archivo_contenido=contenido,
        mime_type=archivo.content_type or "application/octet-stream",
    )
