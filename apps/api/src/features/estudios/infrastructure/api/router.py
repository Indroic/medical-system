from uuid import UUID

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from src.features.usuarios.application.dtos import UserResponse
from src.features.usuarios.infrastructure.api.dependencies import get_current_user

from ...application.dtos import EstudioListResponse, EstudioResponse, RecepcionarEstudioCommand
from ...application.use_cases.recepcionar_estudio import RecepcionarEstudioUseCase
from ...domain.exceptions import EstudioNotFoundException, TipoArchivoNoPermitidoException
from ...infrastructure.repositories import EstudioRepositoryImpl
from .dependencies import get_recepcionar_uc, get_uow

router = APIRouter(prefix="/estudios", tags=["estudios"])


@router.post(
    "/",
    response_model=EstudioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recepcionar nuevo estudio de tomografía",
)
async def recepcionar_estudio(
    paciente_nombre: str = Form(...),
    paciente_apellido: str = Form(...),
    paciente_fecha_nacimiento: str = Form(...),
    paciente_documento: str = Form(...),
    use_case: RecepcionarEstudioUseCase = Depends(get_recepcionar_uc),
    current_user: UserResponse = Depends(get_current_user),
) -> EstudioResponse:
    command = RecepcionarEstudioCommand(
        paciente_nombre=paciente_nombre,
        paciente_apellido=paciente_apellido,
        paciente_fecha_nacimiento=paciente_fecha_nacimiento,
        paciente_documento=paciente_documento,
        medico_id=str(current_user.id),
    )
    try:
        return await use_case.execute(command)
    except TipoArchivoNoPermitidoException as exc:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(exc))


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
            paciente_nombre_completo=e.paciente.nombre_completo,
            imagen_path=e.imagen_path,
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
        paciente_nombre_completo=estudio.paciente.nombre_completo,
        imagen_path=estudio.imagen_path,
        mime_type=estudio.mime_type,
        estado=estudio.estado,
        medico_id=estudio.medico_id,
    )
