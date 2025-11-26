require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB = require('./config/database');
const { initializeWhatsApp } = require('./services/whatsapp');
const messagesRouter = require('./routes/messages');
const historyRouter = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Manejadores de errores globales para evitar caídas del servidor
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Promesa rechazada no manejada:', reason);
  // No cerrar el servidor, solo logear
});

process.on('uncaughtException', (error) => {
  console.error('⚠️  Excepción no capturada:', error.message);
  // Si es un error de EBUSY (archivo bloqueado), no cerrar el servidor
  if (error.code === 'EBUSY' || error.message.includes('EBUSY')) {
    console.log('💡 Archivo bloqueado detectado. El servidor continúa funcionando.');
    console.log('💡 Para reconectar, usa el endpoint /api/messages/qr o reinicia el servidor.');
    return;
  }
  // Para otros errores críticos, podrías querer cerrar
  // process.exit(1);
});

// Middlewares
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Bot API',
    version: '1.0.0',
    documentation: `${BASE_URL}/api-docs`,
    qrCode: `${BASE_URL}/api/messages/qr`,
    endpoints: {
      sendMessage: `${BASE_URL}/api/messages/send`,
      checkStatus: `${BASE_URL}/api/messages/status`,
      getQRCode: `${BASE_URL}/api/messages/qr`,
      restartServer: `${BASE_URL}/api/messages/restart-server`,
      getHistory: `${BASE_URL}/api/history`,
      clearHistory: `${BASE_URL}/api/history/clear`
    }
  });
});

// Rutas de la API
app.use('/api/messages', messagesRouter);
app.use('/api/history', historyRouter);

// Iniciar servidor y bot
const startServer = async () => {
  try {
    // Conectar a MongoDB si está configurado
    if (process.env.MONGODB_URI) {
      await connectDB(process.env.MONGODB_URI);
    } else {
      console.log('⚠️  MONGODB_URI no configurado. El bot funcionará sin historial.');
    }

    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Servidor corriendo en: ${BASE_URL}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📚 Documentación Swagger:');
      console.log(`   ${BASE_URL}/api-docs`);
      console.log('\n📱 Ver código QR en el navegador:');
      console.log(`   ${BASE_URL}/api/messages/qr`);
      console.log('\n📬 Endpoint para enviar mensajes:');
      console.log(`   POST ${BASE_URL}/api/messages/send`);
      console.log('\n   Ejemplo:');
      console.log('   {');
      console.log('     "phone": "5491234567890",');
      console.log('     "message": "Hola desde el bot!"');
      console.log('   }');
      console.log('\n📊 Endpoint para historial:');
      console.log(`   GET ${BASE_URL}/api/history`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    // Inicializar WhatsApp
    await initializeWhatsApp();

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n\n👋 Cerrando bot de WhatsApp...');
  process.exit(0);
});

startServer();
