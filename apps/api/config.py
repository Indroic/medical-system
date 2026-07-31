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
from src.shared.infrastructure.redis_event_dispatcher import RedisStreamEventDispatcher


def _derive_database_urls(base_url: str) -> tuple[str, str]:
    """Deriva las URLs sync y async a partir de una única DATABASE_URL base.

    Acepta una URL base de Postgres (``postgresql://...``) o SQLite (dev) y
    devuelve la tupla ``(sync_url, async_url)`` con el driver adecuado:
      - sync  -> psycopg2  (``postgresql://``)        / ``sqlite://``
      - async -> asyncpg   (``postgresql+asyncpg://``) / ``sqlite+aiosqlite://``

    Cualquier driver ya presente en la URL base se normaliza al correcto.
    """
    url = base_url.strip()

    # SQLite (desarrollo)
    if url.startswith("sqlite"):
        sync_url = url.replace("+aiosqlite", "")
        async_url = url if "+aiosqlite" in url else url.replace("sqlite:", "sqlite+aiosqlite:", 1)
        return sync_url, async_url

    # Postgres: separar el esquema (con o sin driver) del resto de la URL
    rest = url.split("://", 1)[1] if "://" in url else url
    return f"postgresql://{rest}", f"postgresql+asyncpg://{rest}"


# DATABASE_URL = URL sync (psycopg2) — usada por Alembic y conexiones síncronas.
# ASYNC_DATABASE_URL = URL async (asyncpg) — si no se define, se deriva de DATABASE_URL.
_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db.sqlite3")
_SYNC_DATABASE_URL, _DERIVED_ASYNC_URL = _derive_database_urls(_DATABASE_URL)



class ProjectConfig(ServerConfig):
    base_dir: Path = Path(".")
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = os.getenv("ENVIRONMENT") != "production"

    # DATABASE_URL  → sync  (psycopg2) — usado por Alembic.
    # ASYNC_DATABASE_URL → async (asyncpg) — si está definida, se usa directamente;
    # si no, se deriva automáticamente de DATABASE_URL.
    sql_database_url: str = os.getenv("DATABASE_URL", _SYNC_DATABASE_URL)
    async_sql_database_url: str = os.getenv("ASYNC_DATABASE_URL", _DERIVED_ASYNC_URL)

    # Seguridad
    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Auth server (Node/Better-Auth) — usado para validar sesiones
    server_url: str = "http://medical-server:3000"

    # YOLO / IA
    yolo_model_path: str = "models/yolo_resonancia.pt"
    
    # Motor de redacción del informe (LLM). El proveedor es un detalle de
    # infraestructura: el texto generado no debe mencionarlo (ver regla 6).
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model_name: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    gemini_prompt_template: str = os.getenv(
        "GEMINI_PROMPT_TEMPLATE",
        "Eres un oncólogo radiólogo de clase mundial. Recibirás una lista de datos crudos extraídos por el "
        "sistema de detección asistida a partir de múltiples cortes (slices) de una Resonancia Magnética (MRI).\n"
        "Tu tarea es redactar un 'Informe Radiológico' profesional, claro y detallado en español (Markdown).\n\n"
        "REGLAS:\n"
        "1. 'tumor' o 'hemorragia' o 'isquemia' son críticos.\n"
        "2. La columna BBox (X_min, Y_min, X_max, Y_max) indica la ubicación.\n"
        "3. La columna 'image_index' indica en qué corte (slice) se encontró.\n"
        "4. Menciona si hay extensión vertical (el mismo tipo de tumor aparece en cortes secuenciales).\n"
        "5. NO inventes datos. Limítate a interpretar los hallazgos provistos.\n"
        "6. Redacta como lo haría el radiólogo que firma el informe. NO menciones "
        "inteligencia artificial, IA, modelos, redes neuronales, YOLO, algoritmos, "
        "proveedores ni marcas de software, ni te refieras a ti mismo. Habla de "
        "'los hallazgos' o 'el estudio', nunca de cómo se obtuvieron.\n"
        "7. Cierra el informe recordando que requiere la validación de un médico.\n\n"
        "DATOS CRUDOS RECIBIDOS:\n"
        "{datos_crudos}\n\n"
        "Redacta el informe clínico estructurado en formato Markdown:"
    )


    # CORS
    allow_origins: list[str] = ["https://medical.indroic.dev", "http://localhost:3000", "http://localhost:3001"]
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
    event_dispatcher: IEventDispatcher = RedisStreamEventDispatcher()
    model_config = ConfigDict(arbitrary_types_allowed=True)


if os.getenv("ENVIRONMENT") == "production" and os.getenv("DATABASE_URL") is None:
    raise RuntimeError(
        "ENVIRONMENT=production pero DATABASE_URL no llegó al proceso "
        "(cayendo silenciosamente a SQLite). Revisa que la variable esté "
        "definida en Dokploy y referenciada como '${DATABASE_URL}' en docker-compose.yml."
    )

config = ProjectConfig(
    repository_discovery_paths={
        "src.features",
        "src.shared.infrastructure.database",
    }
)
