from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from src.features.usuarios.application.dtos import UserResponse
from src.features.usuarios.infrastructure.api.dependencies import get_current_user
import src.shared.infrastructure.database as shared_db

from ...domain.exceptions import ReporteNotFoundException
from ...infrastructure.repositories import ReporteRepositoryImpl

router = APIRouter(prefix="/reportes", tags=["reportes"])


async def get_uow() -> SqlAlchemyUnitOfWork:
    async with shared_db.async_session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


@router.get(
    "/{estudio_id}",
    summary="Obtener estado del reporte de un estudio",
)
async def obtener_reporte(
    estudio_id: UUID,
    current_user: UserResponse = Depends(get_current_user),
    uow: SqlAlchemyUnitOfWork = Depends(get_uow),
):
    async with uow:
        repo = ReporteRepositoryImpl(uow)
        reporte = await repo.get_by_estudio(estudio_id)

    if reporte is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existe reporte para el estudio {estudio_id}",
        )

    return {
        "reporte_id": str(reporte.id),
        "estado": reporte.estado,
        "nivel_riesgo": reporte.nivel_riesgo,
        "total_hallazgos": reporte.total_hallazgos,
        "pdf_disponible": reporte.pdf_path is not None,
    }


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
