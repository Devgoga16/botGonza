# 🚀 Guía de Despliegue con PM2

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Instalar PM2 globalmente (opcional, ya está en devDependencies)
npm install -g pm2
```

## 🎯 Comandos PM2

### Iniciar el bot
```bash
npm run pm2:start
```

### Reiniciar el bot
```bash
npm run pm2:restart
```

### Detener el bot
```bash
npm run pm2:stop
```

### Ver logs en tiempo real
```bash
npm run pm2:logs
```

### Monitorear recursos
```bash
npm run pm2:monit
```

### Eliminar del PM2
```bash
npm run pm2:delete
```

### Ver estado de todos los procesos
```bash
pm2 list
```

## 🔄 Reiniciar desde la API

Con PM2, puedes reiniciar el bot desde la API:

```bash
curl -X POST http://localhost:3000/api/messages/restart-server
```

PM2 detectará que el proceso terminó y lo reiniciará automáticamente.

## 🌐 Configuración para Producción

### Auto-inicio al reiniciar el servidor
```bash
# Guardar la configuración actual
pm2 save

# Configurar PM2 para iniciar en el arranque del sistema
pm2 startup

# Seguir las instrucciones que muestra el comando anterior
```

### Configuración del ecosistema

El archivo `ecosystem.config.js` tiene la configuración de PM2:
- **Reinicio automático**: Sí
- **Memoria máxima**: 500MB (se reinicia si excede)
- **Logs**: Guardados en `./logs/`
- **Reintentos máximos**: 10
- **Delay entre reintentos**: 4 segundos

## 📊 Monitoreo

```bash
# Ver dashboard en tiempo real
pm2 monit

# Ver logs con filtros
pm2 logs whatsapp-bot --lines 100

# Ver solo errores
pm2 logs whatsapp-bot --err

# Limpiar logs antiguos
pm2 flush
```

## 🔧 Tips

1. **Actualizar código sin downtime**:
   ```bash
   git pull
   npm install
   npm run pm2:restart
   ```

2. **Ver información detallada**:
   ```bash
   pm2 show whatsapp-bot
   ```

3. **Escalar a múltiples instancias** (si es necesario):
   ```bash
   pm2 scale whatsapp-bot 2
   ```

4. **Resetear reinicios**:
   ```bash
   pm2 reset whatsapp-bot
   ```

## 🐳 Alternativa: Docker con PM2

Si prefieres usar Docker con PM2:

```dockerfile
FROM node:18-alpine

RUN npm install -g pm2

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```
