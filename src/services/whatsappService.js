const axios = require('axios');
const config = require('../config/env');

// 1. Mejoramos sendMessage para aceptar el ID del mensaje original
const sendMessage = async (to, text, messageId) => {
  try {
    await axios({
      method: 'POST',
      url: config.META_API_URL,
      headers: {
        'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text },
        // LÓGICA NUEVA: Si nos pasan un ID, respondemos citando el mensaje (Hilos)
        context: messageId ? { message_id: messageId } : undefined
      },
    });
    console.log(`Mensaje enviado a ${to}`);
  } catch (error) {
    console.error('Error enviando mensaje:', error.response ? error.response.data : error.message);
  }
};

// 2. Agregamos la función para poner el Doble Check Azul
const markAsRead = async (messageId) => {
  try {
    await axios({
      method: 'POST',
      url: config.META_API_URL,
      headers: {
        'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
    });
    console.log(`Mensaje ${messageId} marcado como leído`);
  } catch (error) {
    console.error('Error marcando como leído:', error.response ? error.response.data : error.message);
  }
};

//3. Agregamos la funcion para poder enviar botones
const sendInteractiveButtons = async (to, BodyText, buttons) => {
  try {
    await axios({
      method: 'POST',
      url: config.META_API_URL,
      headers: {
        'Authorization': `Bearer ${config.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {text: BodyText},
          actions: {
            buttons: buttons
          }
        }
      },
    });
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  sendMessage,
  markAsRead,
  sendInteractiveButtons
};