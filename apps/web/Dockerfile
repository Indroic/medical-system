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
# Dominio único: por defecto el frontend usa rutas relativas al mismo origen
# (el nginx de 'web' proxyea /api -> server e /imgproxy -> imgproxy). Deja
# VITE_SERVER_URL vacío en producción; en dev local pasa http://localhost:3000.
ARG VITE_SERVER_URL=
ARG VITE_PYTHON_API_URL=
ARG VITE_IMGPROXY_URL=/imgproxy
ARG VITE_IMGPROXY_KEY=73757065722d7365637265742d6b6579
ARG VITE_IMGPROXY_SALT=73757065722d7365637265742d73616c74
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_PYTHON_API_URL=$VITE_PYTHON_API_URL
ENV VITE_IMGPROXY_URL=$VITE_IMGPROXY_URL
ENV VITE_IMGPROXY_KEY=$VITE_IMGPROXY_KEY
ENV VITE_IMGPROXY_SALT=$VITE_IMGPROXY_SALT

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
