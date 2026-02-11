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
        const response = `¡Hola! 👋 Soy Ari, tu asistente virtual. Por el momento no reconocí tu mensaje. Para ver mis opciones y ayudarte mejor, por favor inicia la conversación con un saludo (por ejemplo: Hola Ari, Buenas Ari, Buenos días Ari, Buenas tardes Ari, Buenas noches Ari).`;
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
    const greetings = ["hola","buenas","buenas noches","buenas tardes","buenos dias","holis","que tal","buenaas!","holis"];
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
          title: 'Soporte 📝'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'option_2',
          title: 'Informacion 💡'
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
        responseText = "¡Perfecto! Selecciona alguna de las opciones de soporte:";
        break;
      case 'option_2':
        responseText = "¿Que tipo de informacion necesitas en este momento?";
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