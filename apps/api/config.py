from pathlib import Path
import sys
import os
from types import ModuleType

from pydantic import ConfigDict

# async_typer 0.1.x imports `clear` from typer, which was removed in typer>=0.13.
# async_typer 0.2.x changed the AsyncTyper constructor, breaking hexcore's cli.py.
# Replace with a minimal stub so hexcore can import without errors.
if "async_typer" not in sys.modules:
    class _AsyncTyper:
        def __init__(self, *args, **kwargs): pass
        def command(self, *args, **kwargs): return lambda f: f
        def __call__(self, *args, **kwargs): pass
    _mod = ModuleType("async_typer")
    _mod.AsyncTyper = _AsyncTyper
    sys.modules["async_typer"] = _mod

from hexcore.config import ServerConfig
from hexcore.domain.events import IEventDispatcher
from hexcore.infrastructure.cache import ICache
from hexcore.infrastructure.cache.cache_backends.memory import MemoryCache
from hexcore.infrastructure.events.events_backends.memory import InMemoryEventDispatcher


class ProjectConfig(ServerConfig):
    base_dir: Path = Path(".")
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = os.getenv("ENVIRONMENT") != "production"

    # Base de datos SQL (SQLite para dev, Postgres para prod)
    sql_database_url: str = os.getenv("DATABASE_URL_SYNC", "sqlite:///./db.sqlite3")
    async_sql_database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./db.sqlite3")

    # Seguridad
    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Auth server (Node/Better-Auth) — usado para validar sesiones
    server_url: str = "http://server:3000"

    # YOLO / IA
    yolo_model_path: str = "models/yolo_resonancia.pt"

    # CORS
    allow_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    allow_credentials: bool = True
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]

    cache_backend: ICache = MemoryCache()
    event_dispatcher: IEventDispatcher = InMemoryEventDispatcher()
    model_config = ConfigDict(arbitrary_types_allowed=True)


config = ProjectConfig(
    repository_discovery_paths={
        "src.features",
        "src.shared.infrastructure.database",
    }
)
