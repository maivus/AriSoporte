// Import Express.js y Axios
const express = require('express');
const axios = require('axios'); // <--- NUEVO: Para enviar mensajes

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Configuraciones (Idealmente deberían ir en un archivo .env)
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
// Agrega estas variables en tu entorno o ponlas aquí temporalmente
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; 
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 

// Route for GET requests (Verificación del Webhook)
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests (Recibir mensajes)
app.post('/', async (req, res) => { // <--- Convertimos a async para usar await
  const body = req.body;

  // 1. Verificar si es un evento de WhatsApp
  if (body.object === 'whatsapp_business_account') {
    
    // Iterar sobre las entradas (entries)
    for (const entry of body.entry) {
      // Iterar sobre los cambios (changes)
      for (const change of entry.changes) {
        const value = change.value;

        // 2. Verificar si hay mensajes en el evento
        if (value.messages && value.messages.length > 0) {
          const message = value.messages[0];
          
          // Solo respondemos si es un mensaje de texto
          if (message.type === 'text') {
            const from = message.from; // Número del remitente
            const messageBody = message.text.body; // Texto del mensaje

            console.log(`Mensaje recibido de ${from}: ${messageBody}`);

            // 3. Enviar la respuesta (Echo)
            await sendMessage(from, `Dijiste: ${messageBody}`);
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.status(404).end();
  }
});

// Función para enviar mensajes a la API de WhatsApp
async function sendMessage(to, text) {
  try {
    await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text },
        // context: { message_id: messageId } // Opcional: para citar el mensaje original
      },
    });
    console.log('Mensaje de respuesta enviado exitosamente');
  } catch (error) {
    console.error('Error enviando mensaje:', error.response ? error.response.data : error.message);
  }
}

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
