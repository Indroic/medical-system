from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from src.features.usuarios.application.dtos import UserResponse
from src.features.usuarios.infrastructure.api.dependencies import get_current_user

from ...application.dtos import (
    EstudioListResponse,
    EstudioResponse,
    RecepcionarEstudioCommand,
    RecepcionarEstudioRequest,
    SubirImagenResponse,
)
from ...application.use_cases.recepcionar_estudio import RecepcionarEstudioUseCase
from ...application.use_cases.subir_imagen_estudio import SubirImagenEstudioUseCase
from ...domain.exceptions import EstudioNotFoundException, TipoArchivoNoPermitidoException
from ...infrastructure.repositories import EstudioRepositoryImpl
from .dependencies import get_recepcionar_uc, get_subir_imagen_uc, get_uow

router = APIRouter(prefix="/estudios", tags=["estudios"])


@router.post(
    "/imagenes",
    response_model=SubirImagenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Subir una imagen suelta de un estudio (paso previo a recepcionar)",
)
async def subir_imagen_estudio(
    archivo: UploadFile = File(...),
    use_case: SubirImagenEstudioUseCase = Depends(get_subir_imagen_uc),
    current_user: UserResponse = Depends(get_current_user),
) -> SubirImagenResponse:
    contenido = await archivo.read()
    try:
        return await use_case.execute(
            nombre_archivo=archivo.filename or "imagen",
            contenido=contenido,
            mime_type=archivo.content_type or "application/octet-stream",
        )
    except TipoArchivoNoPermitidoException as exc:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(exc))


@router.post(
    "/",
    response_model=EstudioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recepcionar nuevo estudio de tomografía",
)
async def recepcionar_estudio(
    body: RecepcionarEstudioRequest,
    use_case: RecepcionarEstudioUseCase = Depends(get_recepcionar_uc),
    current_user: UserResponse = Depends(get_current_user),
) -> EstudioResponse:
    command = RecepcionarEstudioCommand(
        paciente_id=body.paciente_id,
        imagenes_paths=body.imagenes_paths,
        mime_type=body.mime_type,
        medico_id=str(current_user.id),
    )
    return await use_case.execute(command)


@router.get(
    "/",
    response_model=EstudioListResponse,
    summary="Listar estudios del médico autenticado",
)
async def listar_estudios(
    current_user: UserResponse = Depends(get_current_user),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> EstudioListResponse:
    async with uow:
        repo = EstudioRepositoryImpl(uow)
        estudios = await repo.list_by_medico(str(current_user.id))

    items = [
        EstudioResponse(
            id=e.id,
            paciente_id=e.paciente_id,
            imagenes_paths=e.imagenes_paths,
            mime_type=e.mime_type,
            estado=e.estado,
            medico_id=e.medico_id,
        )
        for e in estudios
    ]
    return EstudioListResponse(items=items, total=len(items))


@router.get(
    "/{estudio_id}",
    response_model=EstudioResponse,
    summary="Obtener detalle de un estudio",
)
async def obtener_estudio(
    estudio_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> EstudioResponse:
    async with uow:
        repo = EstudioRepositoryImpl(uow)
        try:
            estudio = await repo.get_by_id(estudio_id)
        except EstudioNotFoundException as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return EstudioResponse(
        id=estudio.id,
        paciente_id=estudio.paciente_id,
        imagenes_paths=estudio.imagenes_paths,
        mime_type=estudio.mime_type,
        estado=estudio.estado,
        medico_id=estudio.medico_id,
    )
