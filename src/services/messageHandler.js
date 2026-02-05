const whatsappService = require('./whatsappService');

class MessageHandler {
  
  async handleIncomingMessage(message, senderName) {
    // 1. Marcar como leído inmediatamente
    if (message.id) {
      await whatsappService.markAsRead(message.id);
    }

    // 2. Verificar si es texto
    if (message?.type === 'text') {
      const messageBody = message.text.body;
      const from = message.from;
      const messageId = message.id;

      // Log corregido (ahora messageBody ya existe)
      console.log(`Mensaje de ${senderName} (${from}): ${messageBody}`);

      // Transformamos a minúsculas para comparar mejor
      const inComingMessage = messageBody.toLowerCase().trim();

      // 3. Lógica de Saludo
      if (this.isGreeting(inComingMessage)) {
        await this.sendWelcomeMessage(from, messageId, senderName);
      } else {
        // Respuesta Eco (Si no es saludo)
        const response = `Echo: ${messageBody}`;
        await whatsappService.sendMessage(from, response, messageId);
      }
    }
  }

  isGreeting(message) {
    // Lista de saludos
    const greetings = ["hola", "buenas", "buenas tardes", "buenas noches", "hi", "hello"];
    // Verificamos si el mensaje ESTÁ en la lista exacta
    return greetings.includes(message);
  }

  async sendWelcomeMessage(to, messageId, senderName) {
    // CORRECCIÓN IMPORTANTE: Usamos comillas invertidas (backticks) ` ` para que funcione ${senderName}
    const welcomeMessage = `Hola ${senderName}, gracias por ponerte en contacto conmigo. ¿En qué te puedo ayudar? Estoy lista para ayudarte en cualquiera de tus necesidades.`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }
}

// CORRECCIÓN: Exportación compatible con tu proyecto
module.exports = new MessageHandler();