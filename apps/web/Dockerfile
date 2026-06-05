FROM node:22-alpine AS builder

# Habilitar pnpm
RUN corepack enable pnpm

WORKDIR /app

# Copiar configuraciones de workspace de pnpm y turborepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copiar paquetes compartidos y la aplicación web
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Instalar dependencias del workspace
RUN pnpm install --frozen-lockfile

# Compilar la aplicación React/Vite
WORKDIR /app/apps/web

# Vite hornea las variables VITE_* en el bundle estático durante el build.
# Se reciben como ARG y se exportan como ENV para que el proceso de build las vea.
ARG VITE_SERVER_URL=/server
ARG VITE_PYTHON_API_URL=/api
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_PYTHON_API_URL=$VITE_PYTHON_API_URL

RUN pnpm run build

# Imagen del Servidor Web
FROM nginx:alpine AS runner

# Copiar la aplicación compilada
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copiar la configuración personalizada del proxy inverso
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
