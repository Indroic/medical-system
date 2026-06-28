#!/bin/sh
set -e

echo "============================================="
echo "  API Migrator — inicio"
echo "============================================="
echo "DATABASE_URL raw: ${DATABASE_URL:-<no definida>}"

# Abortar si DATABASE_URL no está definida o apunta a SQLite (error de config)
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL no está definida. Abortando." >&2
  exit 1
fi

case "$DATABASE_URL" in
  sqlite*)
    echo "ERROR: DATABASE_URL apunta a SQLite. En producción debe ser PostgreSQL." >&2
    echo "       Verifica que Dokploy está pasando la variable correctamente." >&2
    exit 1
    ;;
esac

# Normalizar a driver sync psycopg2 (quitar +asyncpg u otro driver async)
DB_SYNC_URL=$(echo "$DATABASE_URL" | sed 's|postgresql+[^:]*://|postgresql://|')
echo "DATABASE_URL normalizada (sync): $DB_SYNC_URL"
echo "---------------------------------------------"

# Verificar si las tablas de negocio existen realmente en Postgres.
# Si no existen pero alembic_version sí, el estado está corrompido
# (deploy anterior fallido) → stamp base para forzar re-aplicación.
echo "Verificando existencia de tabla 'pacientes' en la DB..."

TABLES_EXIST=$(uv run python - <<EOF
import sys
try:
    import sqlalchemy
    e = sqlalchemy.create_engine("${DB_SYNC_URL}")
    with e.connect() as conn:
        r = conn.execute(sqlalchemy.text("SELECT to_regclass('public.pacientes')"))
        val = r.scalar()
        print("yes" if val else "no")
except Exception as ex:
    print(f"ERROR al conectar: {ex}", file=sys.stderr)
    print("no")
EOF
)

echo "Tabla 'pacientes' existe: $TABLES_EXIST"
echo "---------------------------------------------"

if [ "$TABLES_EXIST" = "no" ]; then
  echo "Tablas ausentes — reseteando alembic_version a 'base' para forzar migración completa..."
  uv run alembic stamp base || true
  echo "stamp base completado."
fi

echo "Aplicando: alembic upgrade head ..."
uv run alembic upgrade head
echo "============================================="
echo "  Migraciones completadas con éxito"
echo "============================================="
