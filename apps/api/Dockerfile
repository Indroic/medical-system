FROM python:3.14-slim

# Instalar dependencias del sistema necesarias para OpenCV (YOLO) y utilidades.
# libglib2.0-0 se renombró a libglib2.0-0t64 en Debian 13 (trixie), la base de
# python:3.14-slim, por la transición a time_t de 64 bits. Se intenta el nombre
# nuevo y se cae al antiguo para seguir construyendo también sobre bookworm;
# sin esto apt-get falla con "Unable to locate package" (exit code 100).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    && (apt-get install -y --no-install-recommends libglib2.0-0t64 \
        || apt-get install -y --no-install-recommends libglib2.0-0) \
    && rm -rf /var/lib/apt/lists/*

# Instalar uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Permitir que uv cree su propio entorno virtual (.venv) y agregarlo al PATH
ENV PATH="/app/apps/api/.venv/bin:$PATH"

# Copiar archivos de configuración primero para aprovechar la caché de capas de Docker
COPY apps/api/pyproject.toml apps/api/uv.lock ./apps/api/

WORKDIR /app/apps/api

# Instalar dependencias de producción excluyendo el código fuente
RUN uv sync --frozen --no-dev --no-install-project

# Copiar el resto del código de la API
COPY apps/api/ .

# Instalar el paquete en sí
RUN uv sync --frozen --no-dev

# Copiar scripts auxiliares (migrate.sh, etc.)
COPY apps/api/scripts/ ./scripts/
RUN chmod +x ./scripts/*.sh

EXPOSE 8000

# Ejecutar el servidor FastAPI
CMD ["fastapi", "run", "main.py", "--host", "0.0.0.0", "--port", "8000"]
