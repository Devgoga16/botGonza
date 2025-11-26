const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let whatsappClient = null;
let isReady = false;
let currentQR = null; // Guardar el QR actual

// Wrapper para LocalAuth que maneja errores de archivos bloqueados
class SafeLocalAuth extends LocalAuth {
  async logout() {
    try {
      await super.logout();
    } catch (error) {
      if (error.message.includes('EBUSY') || error.code === 'EBUSY') {
        console.log('⚠️  No se pudo limpiar la sesión (archivos bloqueados). Se limpiará en el próximo reinicio.');
        // Intentar marcar para limpieza posterior
        const authPath = path.join(process.cwd(), '.wwebjs_auth');
        const flagFile = path.join(authPath, '.cleanup_needed');
        try {
          fs.writeFileSync(flagFile, 'true');
        } catch (e) {
          // Ignorar si no se puede escribir
        }
      } else {
        console.error('⚠️  Error en logout:', error.message);
      }
    }
  }
}

const initializeWhatsApp = () => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Iniciando bot de WhatsApp...');
    
    // Verificar si hay flag de limpieza pendiente
    const authPath = path.join(process.cwd(), '.wwebjs_auth');
    const flagFile = path.join(authPath, '.cleanup_needed');
    if (fs.existsSync(flagFile)) {
      console.log('🧹 Detectada limpieza pendiente de sesión anterior...');
      try {
        fs.unlinkSync(flagFile);
        // Intentar limpiar la carpeta de autenticación
        if (fs.existsSync(authPath)) {
          fs.rmSync(authPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
          console.log('✅ Sesión anterior limpiada');
        }
      } catch (e) {
        console.log('⚠️  No se pudo limpiar completamente. Continúa con sesión existente.');
      }
    }
    
    const client = new Client({
      authStrategy: new SafeLocalAuth({
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        executablePath: process.env.CHROME_PATH || undefined
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
      }
    });

    // Evento QR - Se genera cuando no hay sesión activa
    client.on('qr', (qr) => {
      currentQR = qr; // Guardar el QR
      console.log('\n📱 Código QR generado');
      console.log(`💡 Ve a: ${process.env.BASE_URL || 'http://localhost:3000'}/api/messages/qr para escanearlo\n`);
    });

    // Evento de carga
    client.on('loading_screen', (percent, message) => {
      console.log(`⏳ Cargando WhatsApp: ${percent}% - ${message}`);
    });

    // Evento de autenticación exitosa
    client.on('authenticated', () => {
      console.log('✅ Sesión autenticada correctamente');
    });

    // Evento cuando hay una sesión guardada
    client.on('auth_failure', (msg) => {
      console.error('❌ Error de autenticación:', msg);
      reject(new Error('Error de autenticación'));
    });

    // Evento cuando el cliente está listo
    client.on('ready', () => {
      console.log('✅ Bot de WhatsApp conectado y listo para usar!');
      currentQR = null; // Limpiar QR cuando esté conectado
      isReady = true;
      resolve(client);
    });

    // Evento de desconexión
    client.on('disconnected', async (reason) => {
      console.log('⚠️  Bot desconectado:', reason);
      isReady = false;
      currentQR = null;
      
      // Manejar la desconexión de forma segura
      if (reason === 'NAVIGATION') {
        console.log('📱 Sesión cerrada desde el teléfono');
      }
      
      // Intentar limpiar recursos de forma segura
      try {
        if (whatsappClient && whatsappClient.pupBrowser) {
          await whatsappClient.pupBrowser.close().catch(() => {});
        }
      } catch (error) {
        // Ignorar errores al cerrar
      }
    });

    // Manejar errores del cliente
    client.on('error', (error) => {
      console.error('❌ Error en el cliente:', error.message);
    });

    whatsappClient = client;
    client.initialize();
  });
};

const getClient = () => {
  return whatsappClient;
};

const isClientReady = () => {
  return isReady;
};

const getCurrentQR = () => {
  return currentQR;
};

const restartWhatsApp = async () => {
  console.log('\n🔄 Reiniciando bot de WhatsApp...');
  
  // Destruir cliente actual si existe
  if (whatsappClient) {
    try {
      isReady = false;
      
      // Intentar cerrar gracefully
      try {
        await Promise.race([
          whatsappClient.destroy(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        console.log('✅ Cliente anterior destruido correctamente');
      } catch (destroyError) {
        console.log('⚠️  Forzando cierre del cliente...');
        // Intentar forzar el cierre
        if (whatsappClient.pupBrowser) {
          try {
            await whatsappClient.pupBrowser.close();
          } catch (e) {
            console.log('⚠️  Error al cerrar navegador:', e.message);
          }
        }
      }
    } catch (error) {
      console.log('⚠️  Error general al destruir cliente:', error.message);
    }
  }
  
  whatsappClient = null;
  isReady = false;
  
  // Esperar un poco antes de reinicializar
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Reinicializar
  try {
    return await initializeWhatsApp();
  } catch (error) {
    console.error('❌ Error al reinicializar WhatsApp:', error.message);
    throw error;
  }
};

module.exports = {
  initializeWhatsApp,
  getClient,
  isClientReady,
  getCurrentQR,
  restartWhatsApp
};
