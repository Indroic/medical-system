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
RUN pnpm run build

# Imagen del Servidor Web
FROM nginx:alpine AS runner

# Copiar la aplicación compilada
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Inyectar configuración para soporte SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
