from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from config import config

# statement_cache_size=0: la DB de producción es un Postgres externo detrás de un
# connection pooler (tipo PgBouncer en modo transaction pooling). asyncpg cachea
# prepared statements del lado del servidor asumiendo una conexión física estable;
# con pooling por transacción, cada statement puede aterrizar en una conexión
# física distinta y asyncpg reutiliza un plan preparado que ya no corresponde,
# corrompiendo el binding de parámetros de forma silenciosa. Deshabilitar el cache
# de prepared statements es la recomendación estándar de asyncpg/SQLAlchemy para
# este escenario.
engine = create_async_engine(
    config.async_sql_database_url,
    echo=config.debug,
    future=True,
    connect_args={"statement_cache_size": 0},
)

async_session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)
