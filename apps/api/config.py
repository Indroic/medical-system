from pathlib import Path

from pydantic import ConfigDict

from hexcore.config import ServerConfig
from hexcore.domain.events import IEventDispatcher
from hexcore.infrastructure.cache import ICache
from src.shared.infrastructure.events import AsyncEventDispatcher
from hexcore.infrastructure.cache.cache_backends.memory import MemoryCache


class ProjectConfig(ServerConfig):
    base_dir: Path = Path(".")
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # Base de datos SQL (SQLite para dev, Postgres para prod)
    sql_database_url: str = "sqlite:///./db.sqlite3"
    async_sql_database_url: str = "sqlite+aiosqlite:///./db.sqlite3"

    # Seguridad
    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # YOLO / IA
    yolo_model_path: str = "models/yolo_tomografia.pt"

    # CORS
    allow_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    allow_credentials: bool = True
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]

    # Backends
    cache_backend: ICache = MemoryCache()
    event_dispatcher: IEventDispatcher = AsyncEventDispatcher()

    model_config = ConfigDict(arbitrary_types_allowed=True)


config = ProjectConfig(
    repository_discovery_paths={
        "src.features",
        "src.shared.infrastructure.database",
    }
)
