const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp Bot API',
      version: '1.0.0',
      description: 'API REST para enviar mensajes de WhatsApp y consultar historial',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Servidor principal'
      }
    ],
    tags: [
      {
        name: 'Messages',
        description: 'Operaciones para enviar y verificar estado de mensajes'
      },
      {
        name: 'History',
        description: 'Consultar y gestionar historial de mensajes'
      }
    ],
    components: {
      schemas: {
        SendMessageRequest: {
          type: 'object',
          required: ['phone', 'message'],
          properties: {
            phone: {
              type: 'string',
              description: 'Número de teléfono con código de país (sin +)',
              example: '5491123456789'
            },
            message: {
              type: 'string',
              description: 'Mensaje a enviar',
              example: '¡Hola! Este es un mensaje de prueba'
            }
          }
        },
        SendMessageResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Mensaje enviado correctamente'
            },
            to: {
              type: 'string',
              example: '5491123456789'
            }
          }
        },
        StatusResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            ready: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Bot conectado y listo'
            }
          }
        },
        HistoryResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            stats: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  example: 10
                },
                sent: {
                  type: 'integer',
                  example: 9
                },
                failed: {
                  type: 'integer',
                  example: 1
                }
              }
            },
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: '507f1f77bcf86cd799439011'
                  },
                  to: {
                    type: 'string',
                    example: '5491123456789'
                  },
                  message: {
                    type: 'string',
                    example: 'Hola!'
                  },
                  status: {
                    type: 'string',
                    enum: ['sent', 'failed'],
                    example: 'sent'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-11-25T10:30:00.000Z'
                  },
                  error: {
                    type: 'string',
                    nullable: true,
                    example: null
                  }
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Descripción del error'
            }
          }
        }
      }
    },
    paths: {
      '/api/messages/send': {
        post: {
          tags: ['Messages'],
          summary: 'Enviar un mensaje de WhatsApp',
          description: 'Envía un mensaje de WhatsApp a un número específico. El bot debe estar conectado.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SendMessageRequest'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Mensaje enviado correctamente',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SendMessageResponse'
                  }
                }
              }
            },
            400: {
              description: 'Datos inválidos',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  },
                  example: {
                    success: false,
                    error: 'Los campos "phone" y "message" son requeridos'
                  }
                }
              }
            },
            500: {
              description: 'Error al enviar mensaje',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            503: {
              description: 'Bot no está conectado',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  },
                  example: {
                    success: false,
                    error: 'El bot de WhatsApp no está conectado. Por favor, escanea el código QR primero.'
                  }
                }
              }
            }
          }
        }
      },
      '/api/messages/status': {
        get: {
          tags: ['Messages'],
          summary: 'Verificar estado del bot',
          description: 'Verifica si el bot de WhatsApp está conectado y listo para enviar mensajes',
          responses: {
            200: {
              description: 'Estado del bot',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/StatusResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/messages/qr': {
        get: {
          tags: ['Messages'],
          summary: 'Obtener código QR para conectar WhatsApp',
          description: 'Muestra el código QR en diferentes formatos: página HTML interactiva, imagen PNG o descarga. Si el bot ya está conectado, muestra un mensaje de confirmación.',
          parameters: [
            {
              name: 'format',
              in: 'query',
              description: 'Formato de salida del QR',
              required: false,
              schema: {
                type: 'string',
                enum: ['html', 'png', 'download'],
                default: 'html',
                example: 'html'
              }
            }
          ],
          responses: {
            200: {
              description: 'Código QR o estado de conexión',
              content: {
                'text/html': {
                  schema: {
                    type: 'string',
                    description: 'Página HTML con el QR embebido o mensaje de estado'
                  }
                },
                'image/png': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                    description: 'Imagen PNG del código QR (cuando format=png o format=download)'
                  }
                }
              }
            },
            500: {
              description: 'Error al generar el QR',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/messages/restart-server': {
        post: {
          tags: ['Messages'],
          summary: 'Reiniciar servidor completo',
          description: 'Detiene el servidor para reiniciarlo. Útil cuando usas nodemon en desarrollo o PM2 en producción, que lo reiniciarán automáticamente. Si ejecutas manualmente con `npm start`, tendrás que volver a iniciarlo.',
          responses: {
            200: {
              description: 'Servidor reiniciando',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true
                      },
                      message: {
                        type: 'string',
                        example: 'Servidor reiniciando... El proceso se detendrá y debes reiniciarlo manualmente o usar un gestor de procesos.'
                      },
                      note: {
                        type: 'string',
                        example: 'Si usas nodemon o PM2, se reiniciará automáticamente.'
                      }
                    }
                  }
                }
              }
            },
            500: {
              description: 'Error al reiniciar',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/history': {
        get: {
          tags: ['History'],
          summary: 'Obtener historial de mensajes',
          description: 'Consulta el historial de mensajes enviados con filtros opcionales',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              description: 'Cantidad máxima de mensajes a retornar',
              required: false,
              schema: {
                type: 'integer',
                default: 50,
                example: 20
              }
            },
            {
              name: 'status',
              in: 'query',
              description: 'Filtrar por estado del mensaje',
              required: false,
              schema: {
                type: 'string',
                enum: ['sent', 'failed'],
                example: 'sent'
              }
            },
            {
              name: 'phone',
              in: 'query',
              description: 'Buscar mensajes por número de teléfono (búsqueda parcial)',
              required: false,
              schema: {
                type: 'string',
                example: '549112'
              }
            }
          ],
          responses: {
            200: {
              description: 'Historial de mensajes',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HistoryResponse'
                  }
                }
              }
            },
            500: {
              description: 'Error al consultar historial',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            503: {
              description: 'Base de datos no disponible',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  },
                  example: {
                    success: false,
                    error: 'Base de datos no disponible. Verifica la conexión a MongoDB.'
                  }
                }
              }
            }
          }
        }
      },
      '/api/history/clear': {
        delete: {
          tags: ['History'],
          summary: 'Limpiar historial antiguo',
          description: 'Elimina mensajes anteriores a un número específico de días',
          parameters: [
            {
              name: 'days',
              in: 'query',
              description: 'Eliminar mensajes anteriores a este número de días',
              required: false,
              schema: {
                type: 'integer',
                default: 30,
                example: 30
              }
            }
          ],
          responses: {
            200: {
              description: 'Historial limpiado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true
                      },
                      message: {
                        type: 'string',
                        example: 'Se eliminaron 15 mensajes anteriores a 30 días'
                      }
                    }
                  }
                }
              }
            },
            500: {
              description: 'Error al limpiar historial',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [] // No necesitamos archivos adicionales ya que toda la doc está aquí
};

module.exports = swaggerJsdoc(options);
