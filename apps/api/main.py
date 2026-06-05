from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import config
from src.features.usuarios.infrastructure.api.router import router as usuarios_router
from src.features.pacientes.infrastructure.api.router import router as pacientes_router
from src.features.estudios.infrastructure.api.router import router as estudios_router
from src.features.analizador.infrastructure.api.router import router as analizador_router
from src.features.reportes.infrastructure.api.router import router as reportes_router
from src.shared.infrastructure.database import engine

# -- Importar todos los modelos para que Alembic/SQLAlchemy los detecte ------
import src.features.usuarios.infrastructure.models  # noqa: F401
import src.features.pacientes.infrastructure.models  # noqa: F401
import src.features.estudios.infrastructure.models  # noqa: F401
import src.features.analizador.infrastructure.models  # noqa: F401
import src.features.reportes.infrastructure.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # -- Registro de handlers de eventos (inter-slice) -----------------------
    from src.features.analizador.domain.events import AnalisisCompletadoEvent
    from src.features.reportes.application.handlers import on_analisis_completado

    dispatcher = config.event_dispatcher
    dispatcher.register(AnalisisCompletadoEvent, on_analisis_completado)

    # -- Crear tablas en dev (en prod usar: hexcore migrate) ------------------
    if config.debug:
        from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
        import src.shared.infrastructure.database as shared_db

        async with shared_db.engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.create_all)

    yield

    # -- Shutdown: cerrar conexiones del engine -------------------------------
    await engine.dispose()


app = FastAPI(
    title="Sistema de Analisis de Resonancias",
    description="API REST para gestion y analisis de estudios de resonancia magnética.",
    version="1.0.0",
    lifespan=lifespan,
)

# -- CORS ---------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.allow_origins,
    allow_credentials=config.allow_credentials,
    allow_methods=config.allow_methods,
    allow_headers=config.allow_headers,
)

# -- Routers ------------------------------------------------------------------
app.include_router(usuarios_router, prefix="/api/v1")
app.include_router(pacientes_router, prefix="/api/v1")
app.include_router(estudios_router, prefix="/api/v1")
app.include_router(analizador_router, prefix="/api/v1")
app.include_router(reportes_router, prefix="/api/v1")
