FROM node:22-alpine

RUN corepack enable pnpm

WORKDIR /app

# Copiar configuración de workspace y paquetes compartidos (aprovecha la caché de Docker)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

WORKDIR /app/packages/db

CMD ["pnpm", "drizzle-kit", "migrate"]
