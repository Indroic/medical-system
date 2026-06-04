from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from src.features.usuarios.application.dtos import UserResponse
from src.features.usuarios.infrastructure.api.dependencies import get_current_user

from ...application.dtos import AnalisisResponse, EjecutarInferenciaCommand
from ...application.use_cases.ejecutar_inferencia import EjecutarInferenciaUseCase
from ...domain.exceptions import AnalisisNotFoundException, ImagenNoAccesibleException
from ...infrastructure.repositories import AnalisisRepositoryImpl
from .dependencies import get_ejecutar_uc, get_uow

router = APIRouter(prefix="/analisis", tags=["analizador"])


@router.post(
    "/",
    response_model=AnalisisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ejecutar inferencia YOLO sobre un estudio",
)
async def ejecutar_inferencia(
    command: EjecutarInferenciaCommand,
    use_case: EjecutarInferenciaUseCase = Depends(get_ejecutar_uc),
    current_user: UserResponse = Depends(get_current_user),
) -> AnalisisResponse:
    try:
        return await use_case.execute(command)
    except ImagenNoAccesibleException as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.get(
    "/{estudio_id}",
    response_model=AnalisisResponse,
    summary="Obtener resultado de análisis por estudio",
)
async def obtener_analisis(
    estudio_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> AnalisisResponse:
    async with uow:
        repo = AnalisisRepositoryImpl(uow)
        analisis = await repo.get_by_estudio(estudio_id)

    if analisis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe analisis para el estudio {estudio_id}",
        )

    from ...application.dtos import HallazgoDTO
    return AnalisisResponse(
        analisis_id=analisis.id,
        estudio_id=analisis.estudio_id,
        estado=analisis.estado,
        nivel_riesgo=analisis.nivel_riesgo,
        hallazgos=[
            HallazgoDTO(
                etiqueta=h.etiqueta,
                confianza=h.confianza,
                x_min=h.bbox.x_min,
                y_min=h.bbox.y_min,
                x_max=h.bbox.x_max,
                y_max=h.bbox.y_max,
                es_critico=h.es_critico(),
            )
            for h in analisis.hallazgos
        ],
        total_hallazgos=len(analisis.hallazgos),
    )
