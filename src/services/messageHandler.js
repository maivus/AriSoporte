const whatsappService = require('./whatsappService');

class MessageHandler {
  
  async handleIncomingMessage(message, senderName) {
    // --- CORRECCIÓN CLAVE AQUÍ ---
    // Declaramos 'from' y 'messageId' AL PRINCIPIO, para que sirvan tanto para texto como para botones
    const from = message.from;
    const messageId = message.id;

    // 1. Marcar como leído
    if (messageId) {
      await whatsappService.markAsRead(messageId);
    }

    // CASO A: Es un mensaje de TEXTO
    if (message?.type === 'text') {
      const messageBody = message.text.body;
      console.log(`Mensaje de ${senderName} (${from}): ${messageBody}`);
      
      const inComingMessage = messageBody.toLowerCase().trim();

      if (this.isGreeting(inComingMessage)) {
        await this.sendWelcomeMessage(from, messageId, senderName);
        await this.sendWelcomeMenu(from);
      } else {
        const response = `Echo: ${messageBody}`;
        await whatsappService.sendMessage(from, response, messageId);
      }
    } 
    
    // CASO B: Es una respuesta de BOTÓN (Interactive)
    else if (message?.type === 'interactive') {
      const interactiveObject = message.interactive;
      
      if (interactiveObject.type === 'button_reply') {
        const buttonId = interactiveObject.button_reply.id;
        const buttonTitle = interactiveObject.button_reply.title;

        console.log(`Usuario presionó botón: ${buttonTitle} (ID: ${buttonId})`);

        // Ahora 'from' SÍ existe aquí porque lo declaramos arriba del todo
        await this.handleButtonAction(buttonId, from, messageId);
      }
    }
  }

  isGreeting(message) {
    const greetings = ["hola", "buenas", "buenas noches", "buenas tardes"];
    return greetings.some(greeting => message.includes(greeting));
  }

  async sendWelcomeMessage(to, messageId, senderName) {
    const welcomeMessage = `¡Hola ${senderName}! Soy Ari, gracias por ponerte en contacto conmigo.`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    const menuButtons = [
      {
        type: 'reply',
        reply: {
          id: 'option_1', 
          title: 'Agendar Cita 📅'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'option_2',
          title: 'Ver Precios 💰'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'option_3',
          title: 'Hablar con Humano 🙋'
        }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, "¿En qué te puedo ayudar?", menuButtons);
  }

  async handleButtonAction(buttonId, to, messageId) {
    let responseText = '';

    switch (buttonId) {
      case 'option_1':
        responseText = "¡Perfecto! Para agendar una cita, por favor visita nuestro calendario aquí: www.tu-sitio-web.com/agenda";
        break;
      case 'option_2':
        responseText = "Nuestros planes comienzan desde $10/mes. ¿Te gustaría recibir el PDF con el catálogo completo?";
        break;
      case 'option_3':
        responseText = "Entendido. Un asesor humano revisará tu chat pronto. Por favor espera unos minutos. ⏳";
        break;
      default:
        responseText = "Opción no reconocida, por favor intenta de nuevo.";
        break;
    }

    await whatsappService.sendMessage(to, responseText, messageId);
  }
}

module.exports = new MessageHandler();