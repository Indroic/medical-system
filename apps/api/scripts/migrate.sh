#!/bin/sh
set -e

echo "=== Verificando estado de migraciones ==="

# Normalizar DATABASE_URL a driver sync (psycopg2) y comprobar si la tabla
# 'pacientes' existe. Si no existe pero alembic_version sí, el estado está
# corrompido por un deploy anterior fallido.
TABLES_EXIST=$(uv run python - <<'EOF'
import os, re, sys
url = os.environ.get("DATABASE_URL", "")
# Normalizar cualquier driver async a psycopg2 sync
url = re.sub(r"postgresql\+\w+://", "postgresql://", url)
try:
    import sqlalchemy
    e = sqlalchemy.create_engine(url)
    with e.connect() as conn:
        r = conn.execute(sqlalchemy.text("SELECT to_regclass('public.pacientes')"))
        print("yes" if r.scalar() else "no")
except Exception as ex:
    print("no", file=sys.stderr)
    print("no")
EOF
)

echo "Tablas de negocio existen: $TABLES_EXIST"

if [ "$TABLES_EXIST" = "no" ]; then
  echo "=== Tablas ausentes: reseteando alembic_version a base ==="
  uv run alembic stamp base || true
fi

echo "=== Aplicando migraciones ==="
uv run alembic upgrade head
echo "=== Migraciones completadas ==="
