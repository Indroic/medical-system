import os
import tempfile
from collections.abc import AsyncGenerator
from typing import Generator

import httpx
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from hexcore.infrastructure.uow import SqlAlchemyUnitOfWork
from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel

from config import ProjectConfig, config
from main import app as fastapi_app
from tests.mocks import MockPDFAdapter, MockStorageAdapter, MockYoloAdapter

# -- 1. Fixture de archivo SQLite físico temporal -----------------------------
@pytest.fixture(scope="session")
def sqlite_temp_db() -> Generator[str, None, None]:
    """Crea un archivo SQLite físico temporal (necesario para persistencia asíncrona concurrente)
    y lo elimina al terminar todos los tests."""
    fd, path = tempfile.mkstemp(suffix=".sqlite3")
    os.close(fd)
    
    url = f"sqlite+aiosqlite:///{path}"
    yield url
    
    # Limpieza
    try:
        os.remove(path)
    except OSError:
        pass


# -- 2. Fixture de Base de Datos y Sesión -------------------------------------
@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def db_engine(sqlite_temp_db: str):
    engine = create_async_engine(sqlite_temp_db, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)
        
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
def session_factory(db_engine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)


@pytest_asyncio.fixture
async def uow(session_factory) -> AsyncGenerator[SqlAlchemyUnitOfWork, None]:
    """Provee un UoW para inyectar directo en tests de infraestructura/repositorios."""
    async with session_factory() as session:
        yield SqlAlchemyUnitOfWork(session=session)


# -- 3. Configuración de Test inyectando Mocks Nativos Hexcore ----------------
@pytest.fixture(autouse=True)
def override_config(sqlite_temp_db: str) -> Generator[None, None, None]:
    """Sobrescribe la configuración global inyectando dependencias falsas.
    En Hexcore esto es preferible a app.dependency_overrides porque aísla desde la raíz."""
    
    # Respaldamos la config real
    old_url = config.async_sql_database_url
    
    # Mutamos la config para el test
    config.async_sql_database_url = sqlite_temp_db
    
    # NOTA: Los adaptadores de IA y Storage usualmente se inyectan en el router/dependencies
    # Para forzarlos, parcheamos los singletons locales del router.
    # En una app de producción madura de Hexcore, estos se resolverían via DI container.
    import src.features.analizador.infrastructure.api.dependencies as ia_deps
    import src.features.estudios.infrastructure.api.dependencies as storage_deps
    import src.features.reportes.application.handlers as pdf_deps
    import src.shared.infrastructure.database as shared_db
    
    old_ia = ia_deps._yolo_adapter
    old_storage = getattr(storage_deps, 'LocalStorageAdapter', None)
    old_pdf = getattr(pdf_deps, 'ReportLabPDFAdapter', None)
    old_engine = shared_db.engine
    old_factory = shared_db.async_session_factory
    
    # Inyección
    ia_deps._yolo_adapter = MockYoloAdapter()
    storage_deps.LocalStorageAdapter = MockStorageAdapter
    pdf_deps.ReportLabPDFAdapter = MockPDFAdapter
    
    # Motor de DB compartido (usar la BD de test para todo)
    test_engine = create_async_engine(sqlite_temp_db, echo=False)
    shared_db.engine = test_engine
    shared_db.async_session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    
    # Asegurar que las tablas existan antes de que empiece el test
    from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
    import asyncio
    
    async def _init_db():
        print(f"Creating tables on {sqlite_temp_db}. Tables known: {list(BaseModel.metadata.tables.keys())}")
        async with test_engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.create_all)
            
    asyncio.run(_init_db())
    
    yield
    
    # Restauramos
    config.async_sql_database_url = old_url
    ia_deps._yolo_adapter = old_ia
    storage_deps.LocalStorageAdapter = old_storage  # type: ignore
    pdf_deps.ReportLabPDFAdapter = old_pdf  # type: ignore
    shared_db.engine = old_engine
    shared_db.async_session_factory = old_factory


# -- 4. Cliente E2E -----------------------------------------------------------
@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """TestClient asíncrono para pruebas E2E contra la API montada."""
    # Lifespan context asegura que se inicializa la DB si debug=True y corre el EventDispatcher
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=fastapi_app),
        base_url="http://test"
    ) as client:
        yield client
