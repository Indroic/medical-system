from logging.config import fileConfig

# ruff: noqa: E402, I001
import config as my_project_config  # Monkey-patch de typer ANTES de cargar hexcore y carga la config real

from hexcore.infrastructure.repositories.orms.sqlalchemy import Base
from sqlalchemy import engine_from_config, pool
from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

database_url = my_project_config.config.sql_database_url
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# Log explícito para verificar que no se usa SQLite en producción
import sys
_driver = database_url.split("://")[0] if "://" in database_url else "unknown"
print(f"[Alembic] DB driver: {_driver} | URL (parcial): {database_url[:60]}...", file=sys.stderr)
if database_url.startswith("sqlite"):
    print("[Alembic] ADVERTENCIA: usando SQLite — en producción debe ser PostgreSQL", file=sys.stderr)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
from src.features.usuarios.infrastructure.models import UserModel
from src.features.estudios.infrastructure.models import EstudioModel
from src.features.analizador.infrastructure.models import AnalisisModel
from src.features.reportes.infrastructure.models import ReporteModel
from src.features.pacientes.infrastructure.models import PacienteModel

target_metadata = Base.metadata


def include_object(object, name, type_, reflected, compare_to):
    """Restringe autogenerate a las tablas propias de la API.

    Si la base de datos llegara a compartirse con otro servicio (p.ej. las
    tablas de Better-Auth: user/session/account/verification/jwks gestionadas
    por Drizzle en `apps/server`), Alembic vería esas tablas como "no presentes
    en los modelos" y propondría eliminarlas. Ignorando cualquier tabla reflejada
    que no esté en `Base.metadata`, autogenerate nunca tocará tablas ajenas.
    """
    if type_ == "table" and reflected and name not in target_metadata.tables:
        return False
    return True


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
