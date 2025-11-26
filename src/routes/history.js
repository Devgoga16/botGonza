const express = require('express');
const Message = require('../models/Message');

const router = express.Router();

// Endpoint para obtener el historial de mensajes
router.get('/', async (req, res) => {
  try {
    const { limit = 50, status, phone } = req.query;

    // Construir filtros
    const filters = {};
    if (status) {
      filters.status = status;
    }
    if (phone) {
      filters.to = { $regex: phone, $options: 'i' };
    }

    // Obtener mensajes de la base de datos
    const messages = await Message.find(filters)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Obtener estadísticas
    const total = await Message.countDocuments(filters);
    const sent = await Message.countDocuments({ ...filters, status: 'sent' });
    const failed = await Message.countDocuments({ ...filters, status: 'failed' });

    res.json({
      success: true,
      stats: {
        total,
        sent,
        failed
      },
      messages: messages.map(msg => ({
        id: msg._id,
        to: msg.to,
        message: msg.message,
        status: msg.status,
        timestamp: msg.timestamp,
        error: msg.error
      }))
    });

  } catch (error) {
    // Si hay error de BD (no conectada), devolver mensaje apropiado
    if (error.name === 'MongooseError' || !error.name) {
      return res.status(503).json({
        success: false,
        error: 'Base de datos no disponible. Verifica la conexión a MongoDB.'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para limpiar historial antiguo
router.delete('/clear', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    const result = await Message.deleteMany({
      timestamp: { $lt: dateLimit }
    });

    res.json({
      success: true,
      message: `Se eliminaron ${result.deletedCount} mensajes anteriores a ${days} días`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
