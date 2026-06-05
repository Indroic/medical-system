FROM node:22-alpine AS builder

# Habilitar pnpm
RUN corepack enable pnpm

WORKDIR /app

# Copiar configuraciones de workspace de pnpm y turborepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copiar paquetes compartidos y la aplicación server
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Instalar dependencias del workspace
RUN pnpm install --frozen-lockfile

# Compilar la aplicación server
WORKDIR /app/apps/server
RUN pnpm run build

# Imagen de Producción
FROM node:22-alpine AS runner

WORKDIR /app

# Establecer entorno de producción
ENV NODE_ENV=production

# Copiar los node_modules desde la etapa de construcción
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
# drizzle-kit es devDep de packages/db — sus binarios están en packages/db/node_modules
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist

WORKDIR /app/apps/server

EXPOSE 3000

# Aplica schema aditivo (crea role + tabla jwks si no existen) antes de arrancar.
CMD ["sh", "-c", "cd /app/packages/db && node_modules/.bin/drizzle-kit push && cd /app/apps/server && npm run start"]
