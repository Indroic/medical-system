"""
Handler de evento inter-slice.

Cuando el slice `analizador` hace uow.commit(), Hexcore despacha
AnalisisCompletadoEvent. Este módulo define el handler que el slice
`reportes` suscribe a ese evento.

El handler tiene su PROPIO ciclo de UnitOfWork — completamente
independiente de la transacción original del analizador.
"""
import asyncio
import logging

from src.features.analizador.domain.events import AnalisisCompletadoEvent
from src.shared.infrastructure.database import async_session_factory
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork

from ...domain.entities import Reporte
from ..pdf_adapter import ReportLabPDFAdapter
from ..repositories import ReporteRepositoryImpl

logger = logging.getLogger(__name__)


async def on_analisis_completado(event: AnalisisCompletadoEvent) -> None:
    """Reacciona a la finalización del análisis generando un reporte PDF.

    Este handler corre de forma desacoplada — si falla, no revierta
    la transacción del analizador.
    """
    logger.info(
        "Generando reporte para estudio=%s riesgo=%s",
        event.estudio_id,
        event.nivel_riesgo,
    )

    async with async_session_factory() as session:
        uow = SqlAlchemyUnitOfWork(session=session)
        async with uow:
            repo = ReporteRepositoryImpl(uow)
            pdf_adapter = ReportLabPDFAdapter()

            reporte = Reporte(
                estudio_id=event.estudio_id,
                analisis_id=event.entity_id,
                nivel_riesgo=event.nivel_riesgo,
                total_hallazgos=event.total_hallazgos,
            )

            try:
                pdf_path = await pdf_adapter.generar(reporte)
                reporte.marcar_listo(pdf_path)
            except Exception as exc:
                logger.exception("Fallo al generar PDF: %s", exc)
                reporte.marcar_fallido()

            await repo.save(reporte)
            await uow.commit()
