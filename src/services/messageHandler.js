const whatsappService = require('./whatsappService');

class MessageHandler {
  
  async handleIncomingMessage(message, senderName) {
    // Declaramos 'from' y 'messageId' AL PRINCIPIO, para que sirvan tanto para texto como para botones
    const from = message.from;
    const messageId = message.id;
    
    // 1. Marcar como leído inmediatamente
    if (message.id) {
      await whatsappService.markAsRead(message.id);
    }

    // CASO A VERIFICAR SI ES TEXTO PARA RESPUESTA
    if (message?.type === 'text') {
      const messageBody = message.text.body;

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
    // CASO B VERIFICAR SI ES INTERACTIVO PARA RESPUESTA  
    } else if(message?.type === 'interactive') {
      const interactiveObject = message.interactive;
      // Verificamos si es una respuesta de botón ('button_reply')
      if (interactiveObject.type === 'button_reply') {
        const buttonId = interactiveObject.button_reply.id;
        const buttonTitle = interactiveObject.button_reply.title;
        console.log(`Usuario presionó botón: ${buttonTitle} (ID: ${buttonId})`);

        // Llamamos a la lógica específica de botones
        await this.handleButtonAction(buttonId, from, messageId);
        await whatsappService.markAsRead(message.id);
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

  async handleButtonAction(buttonId, to, messageId) {
    let responsetext = '';

    switch (buttonId) {
      case 'option_1':
        responseText = "¡Entendido. Un asesor humano revisará tu chat pronto. Por favor espera unos minutos. ⏳";
        break;
      
      case 'option_2':
        responseText = "Este es el tipo de informacion que hay disponible:";
        break;
      
      case 'option_3':
        responseText = "Estan son las otras opciones que se encuentran disponibles:";
        break;
        
      default:
        responseText = "Opción no reconocida, por favor intenta de nuevo.";
        break;
    }
    // Enviamos la respuesta seleccionada
    await whatsappService.sendMessage(to, responseText, messageId);
  }
}

// CORRECCIÓN: Exportación compatible con tu proyecto
module.exports = new MessageHandler();