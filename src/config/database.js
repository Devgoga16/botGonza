const mongoose = require('mongoose');

const connectDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB correctamente');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.log('⚠️  El bot funcionará sin historial de mensajes');
  }
};

module.exports = connectDB;
