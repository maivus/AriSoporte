require('dotenv').config(); // Carga variables si estás en local, en Render no hará daño.
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// RENDER IMPORTANTE: Render asigna un puerto automáticamente en process.env.PORT
const port = process.env.PORT || 3000;

// Variables de entorno
const verifyToken = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Ruta GET para verificación del Webhook
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Ruta POST para recibir y responder mensajes
app.post('/', async (req, res) => {
  const body = req.body;

  try {
    if (body.object === 'whatsapp_business_account') {
      // Respondemos 200 OK a Meta inmediatamente para evitar que reintenten el envío
      // (Opcional: puedes mover esto al final si prefieres esperar a que se envíe tu respuesta)
      // En producción es mejor responder rápido:
      res.status(200).send('EVENT_RECEIVED');

      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          if (value.messages && value.messages.length > 0) {
            const message = value.messages[0];
            
            // Verificamos que sea texto para evitar errores con audios/imágenes
            if (message.type === 'text') {
              const from = message.from;
              const messageBody = message.text.body;
              
              console.log(`Mensaje recibido de ${from}: ${messageBody}`);
              
              // Enviamos la respuesta
              await sendMessage(from, `Recibido en Render: ${messageBody}`);
            }
          }
        }
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Error procesando el webhook:', error);
    // Nota: Si ya respondiste con res.status(200), no puedes volver a enviar una respuesta aquí.
  }
});

// Función para enviar mensaje
async function sendMessage(to, text) {
  try {
    const response = await axios({
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
      },
    });
    console.log('Respuesta enviada. ID:', response.data.messages[0].id);
  } catch (error) {
    console.error('Fallo al enviar mensaje:', error.response ? error.response.data : error.message);
  }
}

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
