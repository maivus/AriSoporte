const config = require('../config/env');
// Importamos al nuevo "Gerente" en lugar del servicio directo
const messageHandler = require('../services/messageHandler'); 

const verifyWebhook = (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === config.VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

const receiveWebhook = async (req, res) => {
  const body = req.body;

  try {
    if (body.object === 'whatsapp_business_account') {
      res.sendStatus(200);

      // Navegamos por el JSON feo de Facebook
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // 1. EXTRAER INFORMACIÓN DEL CONTACTO
          // El array 'contacts' suele traer el nombre de perfil del usuario (profile.name)
          let senderName = 'Usuario'; // Valor por defecto
          if (value.contacts && value.contacts.length > 0) {
              const fullName = value.contacts[0].profile.name;
              
              // Obtenemos solo el primer nombre
              // LÓGICA DE PRIMER NOMBRE:
              // Dividimos por espacios y tomamos la primera parte
              // Ejemplo: "Jorge Pérez" -> ["Jorge", "Pérez"] -> "Jorge"
              senderName = fullName.split(" ")[0]
          }

          if (value.messages && value.messages.length > 0) {
            const message = value.messages[0];
      
            // AQUÍ ESTÁ LA MAGIA:
            // El controlador ya no piensa, solo delega el trabajo al Handler
            // Le enviamos 'message' Y TAMBIÉN 'senderName'
            await messageHandler.handleIncomingMessage(message,senderName);
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