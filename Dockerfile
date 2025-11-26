FROM node:18-alpine

# Instalar dependencias necesarias para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Instalar PM2 globalmente
RUN npm install -g pm2

# Crear directorio de la app
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente y configuración de PM2
COPY . .

# Crear directorios necesarios
RUN mkdir -p .wwebjs_auth logs && \
    chmod 777 .wwebjs_auth logs

# Exponer puerto
EXPOSE 3000

# Comando para iniciar con PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
