from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

import src.shared.infrastructure.database as shared_db
from src.features.usuarios.application.dtos import UserResponse
from src.features.usuarios.infrastructure.api.dependencies import get_current_user

from ...application.dtos import (
    ActualizarReporteCommand,
    ReporteListResponse,
    ReporteResponse,
)
from ...domain.entities import Reporte
from ...domain.exceptions import ReporteNoEditableException
from ...infrastructure.repositories import ReporteRepositoryImpl

router = APIRouter(prefix="/reportes", tags=["reportes"])


async def get_uow() -> SqlAlchemyUnitOfWork:
    async with shared_db.async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


def _a_response(reporte: Reporte) -> ReporteResponse:
    return ReporteResponse(
        reporte_id=reporte.id,
        estudio_id=reporte.estudio_id,
        estado=reporte.estado,
        nivel_riesgo=reporte.nivel_riesgo,
        total_hallazgos=reporte.total_hallazgos,
        pdf_disponible=reporte.pdf_path is not None,
        observaciones=reporte.observaciones,
        editable=reporte.esta_editable(),
        aprobado_por=reporte.aprobado_por,
        aprobado_en=reporte.aprobado_en,
    )


async def _obtener_o_404(repo: ReporteRepositoryImpl, estudio_id: UUID) -> Reporte:
    reporte = await repo.get_by_estudio(estudio_id)
    if reporte is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe reporte para el estudio {estudio_id}",
        )
    return reporte


@router.get(
    "/",
    response_model=ReporteListResponse,
    summary="Listar reportes (opcionalmente sólo los pendientes de aprobación)",
)
async def listar_reportes(
    pendientes: bool = Query(
        False,
        description="Si es true, devuelve sólo los reportes que aún admiten edición.",
    ),
    current_user: UserResponse = Depends(get_current_user),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> ReporteListResponse:
    async with uow:
        repo = ReporteRepositoryImpl(uow)
        reportes = await repo.listar(solo_pendientes=pendientes)

    items = [_a_response(r) for r in reportes]
    return ReporteListResponse(items=items, total=len(items))


@router.get(
    "/{estudio_id}",
    response_model=ReporteResponse,
    summary="Obtener estado del reporte de un estudio",
)
async def obtener_reporte(
    estudio_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> ReporteResponse:
    async with uow:
        repo = ReporteRepositoryImpl(uow)
        reporte = await _obtener_o_404(repo, estudio_id)

    return _a_response(reporte)


@router.patch(
    "/{estudio_id}",
    response_model=ReporteResponse,
    summary="Editar o complementar un reporte pendiente",
)
async def actualizar_reporte(
    estudio_id: UUID,
    body: ActualizarReporteCommand,
    current_user: UserResponse = Depends(get_current_user),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> ReporteResponse:
    """Sólo admite cambios mientras el reporte NO está aprobado.

    Un reporte aprobado responde 409 CONFLICT: es inmutable por trazabilidad.
    """
    async with uow:
        repo = ReporteRepositoryImpl(uow)
        reporte = await _obtener_o_404(repo, estudio_id)

        try:
            reporte.editar(
                observaciones=body.observaciones,
                nivel_riesgo=body.nivel_riesgo,
            )
        except ReporteNoEditableException as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

        await repo.save(reporte)
        await uow.commit()

    return _a_response(reporte)


@router.post(
    "/{estudio_id}/aprobar",
    response_model=ReporteResponse,
    summary="Aprobar un reporte y bloquear su edición",
)
async def aprobar_reporte(
    estudio_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
) -> ReporteResponse:
    """Transición terminal: registra quién aprobó y cuándo, y congela el reporte."""
    async with uow:
        repo = ReporteRepositoryImpl(uow)
        reporte = await _obtener_o_404(repo, estudio_id)

        try:
            reporte.aprobar(medico_id=str(current_user.id))
        except ReporteNoEditableException as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

        await repo.save(reporte)
        await uow.commit()

    return _a_response(reporte)


@router.get(
    "/{estudio_id}/descargar",
    summary="Descargar PDF del reporte",
)
async def descargar_pdf(
    estudio_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    async with uow:
        repo = ReporteRepositoryImpl(uow)
        reporte = await repo.get_by_estudio(estudio_id)

    if reporte is None or reporte.pdf_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF no disponible aún. El reporte puede estar en generación.",
        )

    return FileResponse(
        path=reporte.pdf_path,
        media_type="application/pdf",
        filename=f"reporte_{estudio_id}.pdf",
    )
