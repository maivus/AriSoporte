const whatsappService = require('./whatsappService');

const handleIncomingMessage = async (message, senderName) => {
  // Extraemos datos básicos
  const messageId = message.id;
  const from = message.from;

  try {
    // 1. Marcar como leído inmediatamente (Lógica de vistos)
    await whatsappService.markAsRead(messageId);

    // 2. Solo procesamos mensajes de texto por ahora
    if (message.type === 'text') {
      const messageBody = message.text.body;

      // Log para ver que capturamos bien el nombre
      console.log(`Mensaje de ${senderName} (${from}): ${messageBody}`);
      console.log(`Procesando mensaje de ${from}: ${messageBody}`);

      // --- LÓGICA DE DECISIÓN (Tu código de emojis) ---
      
      const regexEmoji = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
      const tieneEmoji = regexEmoji.test(messageBody);

      if (tieneEmoji) {
        // Respuesta A: Emoji
        await whatsappService.sendMessage(from, '👍🏽', messageId);
      } else {
        // Respuesta B: Texto Default
        const respuestaDefault = `Gracias por escribirme ${senderName}! Recuerda que el departamento de sistemas esta trabajando muy duro para ponerme en funcionamiento lo antes posible. Nos vemos pronto!!! Aro somos todos ❤️`;
        await whatsappService.sendMessage(from, respuestaDefault, messageId);
      }
    } else {
      console.log('Mensaje recibido pero no es texto (audio, imagen, etc)');
    }
  } catch (error) {
    console.error('Error en messageHandler:', error);
  }
};

module.exports = {
  handleIncomingMessage
};