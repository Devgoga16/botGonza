const express = require('express');
const { getClient, isClientReady, getCurrentQR } = require('../services/whatsapp');
const Message = require('../models/Message');
const QRCode = require('qrcode');

const router = express.Router();

// Endpoint para enviar mensajes
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;

    // Validar datos
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Los campos "phone" y "message" son requeridos'
      });
    }

    // Verificar que el bot esté listo
    if (!isClientReady()) {
      return res.status(503).json({
        success: false,
        error: 'El bot de WhatsApp no está conectado. Por favor, escanea el código QR primero.'
      });
    }

    const client = getClient();

    // Formatear número de teléfono (agregar @c.us si no lo tiene)
    let phoneNumber = phone.replace(/[^0-9]/g, '');
    
    // Si el número no tiene código de país, agregar uno por defecto (opcional)
    // phoneNumber = phoneNumber.startsWith('521') ? phoneNumber : '521' + phoneNumber;
    
    const chatId = phoneNumber + '@c.us';

    try {
      // Enviar mensaje
      await client.sendMessage(chatId, message);

      // Guardar en base de datos
      try {
        const messageDoc = new Message({
          to: phone,
          message: message,
          status: 'sent'
        });
        await messageDoc.save();
      } catch (dbError) {
        console.log('⚠️  No se pudo guardar en BD:', dbError.message);
      }

      res.json({
        success: true,
        message: 'Mensaje enviado correctamente',
        to: phone
      });

    } catch (sendError) {
      // Guardar error en base de datos
      try {
        const messageDoc = new Message({
          to: phone,
          message: message,
          status: 'failed',
          error: sendError.message
        });
        await messageDoc.save();
      } catch (dbError) {
        console.log('⚠️  No se pudo guardar error en BD:', dbError.message);
      }

      res.status(500).json({
        success: false,
        error: 'Error al enviar mensaje: ' + sendError.message
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para verificar el estado del bot
router.get('/status', (req, res) => {
  res.json({
    success: true,
    ready: isClientReady(),
    message: isClientReady() ? 'Bot conectado y listo' : 'Bot no está listo. Escanea el código QR.',
    qrAvailable: getCurrentQR() !== null
  });
});

// Endpoint para obtener el código QR como imagen
router.get('/qr', async (req, res) => {
  try {
    const qrData = getCurrentQR();
    
    if (!qrData) {
      // Si no hay QR, devolver una página HTML con información
      if (isClientReady()) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>WhatsApp Bot - QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              }
              h1 { color: #25D366; margin: 0 0 20px 0; }
              p { color: #666; font-size: 18px; }
              .icon { font-size: 80px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✅</div>
              <h1>Bot Conectado</h1>
              <p>El bot de WhatsApp ya está conectado y listo para usar.</p>
              <p>No es necesario escanear el código QR.</p>
            </div>
          </body>
          </html>
        `);
      } else {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>WhatsApp Bot - QR Code</title>
            <meta http-equiv="refresh" content="3">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              }
              h1 { color: #667eea; margin: 0 0 20px 0; }
              p { color: #666; font-size: 18px; }
              .loader { 
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="loader"></div>
              <h1>Generando Código QR...</h1>
              <p>El bot se está inicializando.</p>
              <p><small>Esta página se actualizará automáticamente</small></p>
            </div>
          </body>
          </html>
        `);
      }
    }

    // Obtener formato solicitado (default: html con imagen)
    const format = req.query.format || 'html';

    if (format === 'png') {
      // Devolver imagen PNG directamente
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="whatsapp-qr.png"');
      await QRCode.toBuffer(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then(buffer => {
        res.send(buffer);
      });
    } else if (format === 'download') {
      // Descargar imagen PNG
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="whatsapp-qr.png"');
      await QRCode.toBuffer(qrData, {
        width: 400,
        margin: 2
      }).then(buffer => {
        res.send(buffer);
      });
    } else {
      // HTML con imagen embebida y auto-refresh
      const qrImage = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp Bot - QR Code</title>
          <meta http-equiv="refresh" content="30">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }
            .container {
              text-align: center;
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 500px;
            }
            h1 { color: #25D366; margin: 0 0 10px 0; }
            .subtitle { color: #666; margin-bottom: 30px; font-size: 16px; }
            .qr-container {
              background: white;
              padding: 20px;
              border-radius: 10px;
              display: inline-block;
              margin-bottom: 20px;
            }
            img { max-width: 100%; height: auto; }
            .instructions {
              text-align: left;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              margin-top: 20px;
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 10px 0;
              color: #555;
            }
            .download-btn {
              display: inline-block;
              background: #25D366;
              color: white;
              padding: 12px 30px;
              border-radius: 25px;
              text-decoration: none;
              margin: 10px 5px;
              transition: background 0.3s;
            }
            .download-btn:hover {
              background: #128C7E;
            }
            .refresh-info {
              color: #999;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📱 Conecta tu WhatsApp</h1>
            <p class="subtitle">Escanea este código QR con tu aplicación de WhatsApp</p>
            
            <div class="qr-container">
              <img src="${qrImage}" alt="WhatsApp QR Code">
            </div>
            
            <div>
              <a href="/api/messages/qr?format=download" class="download-btn">📥 Descargar QR</a>
              <a href="/api/messages/qr?format=png" class="download-btn" target="_blank">🖼️ Ver Imagen</a>
            </div>
            
            <div class="instructions">
              <strong>📋 Instrucciones:</strong>
              <ol>
                <li>Abre WhatsApp en tu teléfono</li>
                <li>Ve a <strong>Configuración</strong> > <strong>Dispositivos vinculados</strong></li>
                <li>Toca <strong>Vincular un dispositivo</strong></li>
                <li>Escanea este código QR</li>
              </ol>
            </div>
            
            <p class="refresh-info">⏱️ Esta página se actualiza automáticamente cada 30 segundos</p>
          </div>
        </body>
        </html>
      `);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para reiniciar el servidor completo
router.post('/restart-server', async (req, res) => {
  try {
    console.log('\n🔄 Solicitud de reinicio del servidor recibida');
    
    res.json({
      success: true,
      message: 'Servidor reiniciando...',
      note: 'El servidor se reiniciará en 2 segundos.'
    });

    setTimeout(() => {
      console.log('\n🔄 Reiniciando servidor...');
      
      const fs = require('fs');
      const path = require('path');
      
      // Detectar el entorno
      const isNodemon = process.env.npm_lifecycle_event === 'dev' || 
                        process.argv.some(arg => arg.includes('nodemon'));
      const isPM2 = process.env.PM2_HOME || process.env.pm_id !== undefined;
      
      if (isNodemon) {
        // Modo desarrollo con nodemon: tocar archivo para reiniciar
        const triggerFile = path.join(__dirname, '../index.js');
        try {
          const time = new Date();
          fs.utimesSync(triggerFile, time, time);
          console.log('✅ Reinicio iniciado por nodemon');
        } catch (err) {
          console.log('💤 Cerrando servidor...');
          process.exit(0);
        }
      } else if (isPM2) {
        // Modo PM2: exit limpio y PM2 reinicia automáticamente
        console.log('✅ Enviando señal de reinicio a PM2...');
        process.exit(0);
      } else {
        // Modo producción/Docker: hacer exit
        console.log('💤 Cerrando servidor para reinicio...');
        console.log('💡 Asegúrate de tener un gestor de procesos (PM2, Docker, systemd, etc.)');
        process.exit(0);
      }
    }, 2000);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
