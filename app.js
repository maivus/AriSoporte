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
              // No es necesario leer el body del mensaje si no lo vas a repetir, 
              // pero lo dejamos por si quieres verlo en consola:
              const messageBody = message.text.body;
              console.log(`Mensaje recibido de ${from}: ${messageBody}`);
              
              // TU NUEVO MENSAJE AQUÍ:
              const nuevoMensaje = "Gracias por escribirme! Recuerda que el departamento de sistemas esta trabajando muy duro para ponerme en funcionamiento lo antes posible. Nos vemos pronto!!! Aro somos todos ❤️";
              
              // Enviamos la respuesta
              await sendMessage(from, nuevoMensaje);
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

// Función para enviar mensaje MEJORADA PARA DEBUGGING
async function sendMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
    // Imprimimos los datos antes de enviar para verificar
    console.log(`Intento de envío a: ${to}`);
    console.log(`Usando ID de Teléfono: ${process.env.PHONE_NUMBER_ID}`);
    
    const response = await axios({
      method: 'POST',
      url: url,
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text },
      },
    });
    console.log('EXITO: Respuesta enviada. ID:', response.data.messages[0].id);
  } catch (error) {
    // AQUÍ ESTÁ LA CLAVE: Imprimir el error detallado de Facebook
    console.error('FALLO EL ENVIO:');
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Status:', error.response.status);
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('No hubo respuesta del servidor de Meta');
    } else {
      // Algo pasó al configurar la petición
      console.error('Error de configuración:', error.message);
    }
  }
}

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
