const config = require('../config/env');
const whatsappService = require('../services/whatsappService');

// VERIFICACIÓN DEL WEBHOOK (GET)
const verifyWebhook = (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === config.VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

// RECEPCIÓN DE MENSAJES (POST)
const receiveWebhook = async (req, res) => {
  const body = req.body;

  try {
    if (body.object === 'whatsapp_business_account') {
      
      // Enviamos 200 OK rápido a Meta
      res.sendStatus(200);

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          if (value.messages && value.messages.length > 0) {
            const message = value.messages[0];

            if (message.type === 'text') {
              const from = message.from;
              const messageBody = message.text.body;

              console.log(`Mensaje de ${from}: ${messageBody}`);
              // --- NUEVA LÓGICA DE DECISIÓN ---

              // Usamos Regex para detectar si el mensaje contiene Emojis
              // \p{Emoji} es compatible con Node.js moderno
              const esSoloEmoji= /^[\p{Emoji}\s]+$/u.test(messageBody);

              if (esSoloEmoji) {
                // Opción A: Si enviaron un emoji, respondemos con el pulgar
                await whatsappService.sendMessage(from, '👍🏽');
              } else {
                // Opción B: Si es puro texto, enviamos el mensaje default
                const respuestaDefault = "Gracias por escribirme! Recuerda que el departamento de sistemas esta trabajando muy duro para ponerme en funcionamiento lo antes posible. Nos vemos pronto!!! Aro somos todos ❤️";
                await whatsappService.sendMessage(from, respuestaDefault);
              }
            }
          }
        }
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Error en el controlador:', error);
  }
};

module.exports = {
  verifyWebhook,
  receiveWebhook
};