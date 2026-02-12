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
//Test
//3. Agregamos la funcion para poder enviar botones
const sendInteractiveButtons = async (to, bodyText, buttons) => {
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
          body: { text: bodyText },
          action: {
            buttons: buttons // Aquí van los botones que definiremos en el handler
          }
        }
      },
    });
    console.log(`Menú interactivo enviado a ${to}`);
  } catch (error) {
    console.error('Error enviando botones:', error.response ? error.response.data : error.message);
  }
};

//4. Funcion para enviar distintos tipos de archivos: imagen,video,audio
const sendMediaMessage = async (to, type, mediaUrl, caption, messageId) => {
  try {
    const mediaObject = {};

    switch (type) {
      case 'image':
        mediaObject.image = { link: mediaUrl, caption: caption };
        break;
      case 'audio':
        mediaObject.audio = { link: mediaUrl };
        break;
      case 'video':
        mediaObject.video = { link: mediaUrl, caption: caption };
        break;
      case 'document':
        // CORRECCIÓN AQUÍ: Antes decía mediaObject.image, debe ser .document
        mediaObject.document = { 
          link: mediaUrl, 
          caption: caption, 
          filename: 'medpet_info.pdf' // Puedes hacerlo dinámico si prefieres en el futuro
        };
        break;
      default:
        throw new Error('Tipo de media no soportado');
    }

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
        type: type,
        ...mediaObject, // Esparce el objeto (ej: { image: {...} })
        context: messageId ? { message_id: messageId } : undefined // Soporte para Hilos
      },
    });
    console.log(`Media (${type}) enviada a ${to}`);

  } catch (error) {
    console.error('Error enviando Media:', error.response ? error.response.data : error.message);
  }
};


module.exports = {
  sendMessage,
  markAsRead,
  sendInteractiveButtons,
  sendMediaMessage
};