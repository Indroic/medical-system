import os
import sys
from pathlib import Path
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
    
    # LLM (Ollama)
    ollama_url: str = os.getenv("OLLAMA_URL", "http://ollama:11434")
    ollama_model_name: str = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
    ollama_prompt_template: str = os.getenv(
        "OLLAMA_PROMPT_TEMPLATE",
        "Eres un oncólogo radiólogo de clase mundial. Recibirás una lista de datos crudos extraídos por un "
        "modelo de visión artificial (YOLO) a partir de múltiples cortes (slices) de una Resonancia Magnética (MRI).\n"
        "Tu tarea es redactar un 'Informe Radiológico' profesional, claro y detallado en español (Markdown).\n\n"
        "REGLAS:\n"
        "1. 'tumor' o 'hemorragia' o 'isquemia' son críticos.\n"
        "2. La columna BBox (X_min, Y_min, X_max, Y_max) indica la ubicación.\n"
        "3. La columna 'image_index' indica en qué corte (slice) se encontró.\n"
        "4. Menciona si hay extensión vertical (el mismo tipo de tumor aparece en cortes secuenciales).\n"
        "5. NO inventes datos. Limítate a interpretar los hallazgos provistos.\n\n"
        "DATOS CRUDOS RECIBIDOS:\n"
        "{datos_crudos}\n\n"
        "Redacta el informe clínico estructurado en formato Markdown:"
    )

    # CORS
    allow_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    allow_credentials: bool = True
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]

    # S3 Storage
    s3_endpoint: str = os.getenv("S3_ENDPOINT", "http://localhost:8333")
    s3_access_key: str = os.getenv("AWS_ACCESS_KEY_ID", "seaweed")
    s3_secret_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "seaweed")
    s3_region: str = os.getenv("AWS_REGION", "us-east-1")
    s3_bucket: str = os.getenv("S3_BUCKET", "medical-system")

    cache_backend: ICache = MemoryCache()
    event_dispatcher: IEventDispatcher = InMemoryEventDispatcher()
    model_config = ConfigDict(arbitrary_types_allowed=True)


config = ProjectConfig(
    repository_discovery_paths={
        "src.features",
        "src.shared.infrastructure.database",
    }
)
