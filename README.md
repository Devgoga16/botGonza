# 🤖 WhatsApp Bot Template

Bot de WhatsApp para enviar mensajes a través de una API REST usando `whatsapp-web.js`.

## 📋 Características

- ✅ Conexión a WhatsApp mediante código QR
- ✅ Persistencia de sesión (no es necesario escanear el QR cada vez)
- ✅ API REST para enviar mensajes
- ✅ Historial de mensajes en MongoDB
- ✅ Verificación de estado del bot
- ✅ Configuración mediante variables de entorno

## 🚀 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**

Crea un archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
PORT=3000
BASE_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/whatsapp-bot
```

3. **Asegúrate de tener MongoDB corriendo** (opcional, pero necesario para el historial):
```bash
# Si tienes MongoDB instalado localmente
mongod
```

## 🎯 Uso

### Iniciar el bot

```bash
npm start
```

O en modo desarrollo con auto-reload:
```bash
npm run dev
```

### Primera vez - Escanear código QR

Al iniciar el bot por primera vez, verás un código QR en la consola:

1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** > **Dispositivos vinculados**
3. Toca **Vincular un dispositivo**
4. Escanea el código QR que aparece en la consola

Una vez escaneado, la sesión quedará guardada y no necesitarás volver a escanear el QR.

### Ver la URL del endpoint

Cuando el servidor esté listo, verás en consola:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Servidor corriendo en: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Documentación Swagger:
   http://localhost:3000/api-docs

📬 Endpoint para enviar mensajes:
   POST http://localhost:3000/api/messages/send
```

## 📚 Documentación Swagger

Una vez iniciado el servidor, puedes acceder a la documentación interactiva en:

**http://localhost:3000/api-docs**

Desde Swagger puedes:
- 📖 Ver todos los endpoints disponibles
- 🧪 Probar las API directamente desde el navegador
- 📝 Ver ejemplos de request/response
- 🔍 Consultar los esquemas de datos

## 📡 API Endpoints

### 1. Enviar mensaje

**POST** `/api/messages/send`

```json
{
  "phone": "5491234567890",
  "message": "¡Hola! Este es un mensaje de prueba"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Mensaje enviado correctamente",
  "to": "5491234567890"
}
```

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"5491234567890\",\"message\":\"Hola desde el bot!\"}"
```

**Ejemplo con PowerShell:**
```powershell
$body = @{
    phone = "5491234567890"
    message = "Hola desde el bot!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/messages/send" -Method Post -Body $body -ContentType "application/json"
```

### 2. Ver historial de mensajes

**GET** `/api/history`

Parámetros opcionales:
- `limit`: Cantidad de mensajes (default: 50)
- `status`: Filtrar por estado (`sent` o `failed`)
- `phone`: Buscar por número de teléfono

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "sent": 9,
    "failed": 1
  },
  "messages": [
    {
      "id": "...",
      "to": "5491234567890",
      "message": "Hola!",
      "status": "sent",
      "timestamp": "2025-11-25T10:30:00.000Z",
      "error": null
    }
  ]
}
```

**Ejemplos:**
```bash
# Ver últimos 20 mensajes
curl http://localhost:3000/api/history?limit=20

# Ver solo mensajes fallidos
curl http://localhost:3000/api/history?status=failed

# Buscar por teléfono
curl http://localhost:3000/api/history?phone=549123
```

### 3. Verificar estado del bot

**GET** `/api/messages/status`

```json
{
  "success": true,
  "ready": true,
  "message": "Bot conectado y listo"
}
```

### 4. Limpiar historial antiguo

**DELETE** `/api/history/clear?days=30`

Elimina mensajes anteriores a X días (default: 30).

## 📁 Estructura del Proyecto

```
Bot WhatsApp/
├── src/
│   ├── config/
│   │   └── database.js       # Configuración de MongoDB
│   ├── models/
│   │   └── Message.js        # Modelo de mensajes
│   ├── routes/
│   │   ├── messages.js       # Rutas para enviar mensajes
│   │   └── history.js        # Rutas para historial
│   ├── services/
│   │   └── whatsapp.js       # Servicio de WhatsApp Web
│   └── index.js              # Punto de entrada
├── .env.example              # Ejemplo de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## ⚙️ Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `BASE_URL` | URL base donde está desplegado | `http://localhost:3000` |
| `MONGODB_URI` | Cadena de conexión a MongoDB | `mongodb://localhost:27017/whatsapp-bot` |

## 🔧 Formato de números telefónicos

Los números deben incluir el código de país sin el símbolo `+`:

- ✅ Argentina: `5491123456789`
- ✅ México: `521234567890`
- ✅ España: `34612345678`

El bot agregará automáticamente `@c.us` al final del número.

## 🐛 Solución de problemas

### El código QR no aparece
- Verifica que no haya una sesión previa corrupta
- Elimina la carpeta `.wwebjs_auth` y vuelve a intentar

### "Bot no está listo"
- Asegúrate de haber escaneado el código QR
- Verifica que WhatsApp esté abierto en tu teléfono
- Revisa los logs del servidor

### No se guarda el historial
- Verifica que MongoDB esté corriendo
- Comprueba que la variable `MONGODB_URI` sea correcta
- El bot funcionará sin MongoDB, pero no guardará historial

## 📝 Notas

- La sesión de WhatsApp se guarda en la carpeta `.wwebjs_auth`
- No es necesario escanear el QR cada vez que inicias el bot
- Si cambias de número, elimina `.wwebjs_auth` y vuelve a escanear
- El bot puede tardar unos segundos en estar listo después del inicio

## 📄 Licencia

MIT
