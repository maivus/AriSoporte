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
        await this.sendWelcomeMenu(from);
      } else {
        // Respuesta Eco (Si no es saludo)
        const response = `Echo: ${messageBody}`;
        await whatsappService.sendMessage(from, response, messageId);
      }
    }
  }

  isGreeting(message) {
    // Lista de saludos
    const greetings = ["hola", "buenas", "buenas tardes", "buenos dias", "buenas noches", "hi", "hello"];
    // Verificamos si el mensaje ESTÁ en la lista exacta. la funcion some evalua que la cadena de texto contenga alguna de esas palabras
    return greetings.some(greeting => message.includes(greeting));
  }

  async sendWelcomeMessage(to, messageId, senderName) {
    // CORRECCIÓN IMPORTANTE: Usamos comillas invertidas (backticks) ` ` para que funcione ${senderName}
    const welcomeMessage = `¡Hola ${senderName}! Soy Ari, gracias por ponerte en contacto conmigo. ¿En qué te puedo ayudar?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to){
    const menuMessage = "Por favor selecciona una opcion.";
    const buttons = [
      {
        type: 'reply', reply: { id: 'option_1', title: 'Soporte' }
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'Informacion' }
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'Otros' }
      },
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }
}

// CORRECCIÓN: Exportación compatible con tu proyecto
module.exports = new MessageHandler();