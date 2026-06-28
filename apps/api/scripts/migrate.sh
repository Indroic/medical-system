#!/bin/sh
set -e

echo "============================================="
echo "  API Migrator — inicio"
echo "============================================="
echo "DATABASE_URL raw: ${DATABASE_URL:-<no definida>}"

# Abortar si DATABASE_URL no está definida o apunta a SQLite
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL no está definida. Abortando." >&2
  exit 1
fi

case "$DATABASE_URL" in
  sqlite*)
    echo "ERROR: DATABASE_URL apunta a SQLite. En producción debe ser PostgreSQL." >&2
    exit 1
    ;;
esac

# Normalizar a driver sync psycopg2
DB_SYNC_URL=$(echo "$DATABASE_URL" | sed 's|postgresql+[^:]*://|postgresql://|')
echo "DATABASE_URL normalizada (sync): $DB_SYNC_URL"
echo "---------------------------------------------"

# Función para listar tablas actuales en la DB
list_tables() {
  uv run python - <<EOF
import sys
try:
    import sqlalchemy, re
    url = re.sub(r"postgresql\+\w+://", "postgresql://", "$DB_SYNC_URL")
    e = sqlalchemy.create_engine(url)
    with e.connect() as conn:
        rows = conn.execute(sqlalchemy.text(
            "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
        ))
        tables = [r[0] for r in rows]
        print("  Tablas en public: " + str(tables))
        print("  Total: " + str(len(tables)))
except Exception as ex:
    print(f"  ERROR al listar tablas: {ex}", file=sys.stderr)
EOF
}

echo "Estado ANTES de migrar:"
list_tables
echo "---------------------------------------------"

# Si las tablas de negocio no existen, hacer stamp base para forzar re-migración
TABLES_EXIST=$(uv run python - <<EOF
import sys, re
try:
    import sqlalchemy
    url = re.sub(r"postgresql\+\w+://", "postgresql://", "$DB_SYNC_URL")
    e = sqlalchemy.create_engine(url)
    with e.connect() as conn:
        r = conn.execute(sqlalchemy.text("SELECT to_regclass('public.pacientes')"))
        print("yes" if r.scalar() else "no")
except Exception as ex:
    print(f"ERROR: {ex}", file=sys.stderr)
    print("no")
EOF
)

echo "Tabla 'pacientes' existe: $TABLES_EXIST"

if [ "$TABLES_EXIST" = "no" ]; then
  echo "Tablas ausentes — reseteando alembic_version a 'base'..."
  uv run alembic stamp base || true
  echo "stamp base completado."
fi

echo "============================================="
echo "Aplicando: alembic upgrade head ..."
echo "============================================="
uv run alembic upgrade head

echo "============================================="
echo "Estado DESPUÉS de migrar:"
list_tables
echo "============================================="
echo "  Migraciones completadas"
echo "============================================="
