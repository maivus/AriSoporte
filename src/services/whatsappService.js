const axios = require('axios');
const config = require('../config/env');

const sendMessage = async (to, text) => {
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
      },
    });
    console.log(`Mensaje enviado a ${to}`);
  } catch (error) {
    console.error('Error en WhatsApp Service:', error.response ? error.response.data : error.message);
  }
};

module.exports = {
  sendMessage
};