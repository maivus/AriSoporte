const whatsappService = require('./whatsappService');

// Gestión de estados en memoria (Se limpia si reinicias el servidor)
const userSessions = {};

class MessageHandler {
  
  async handleIncomingMessage(message, senderName) {
    const from = message.from;
    const messageId = message.id;

    if (messageId) {
      await whatsappService.markAsRead(messageId);
    }

    // --- LÓGICA DE FLUJO DE REGISTRO (TEXTO) ---
    if (message?.type === 'text' && userSessions[from]) {
      await this.handleRegistrationFlow(from, message.text.body, messageId);
      return; // Salimos para no procesar el texto como un saludo
    }

    // CASO A: Es un mensaje de TEXTO (Saludo o comandos)
    if (message?.type === 'text') {
      const messageBody = message.text.body;
      const inComingMessage = messageBody.toLowerCase().trim();

      if (this.isGreeting(inComingMessage)) {
        await this.sendWelcomeMessage(from, messageId, senderName);
        await this.sendWelcomeMenu(from);
      } else if (inComingMessage.includes('imagen')) {
        await this.sendMedia(from, messageId);
      } else {
        const response = `¡Hola! 👋 Soy Ari. Por el momento no reconocí tu mensaje. Por favor inicia con un saludo para ayudarte.`;
        await whatsappService.sendMessage(from, response, messageId);
      }
    } 
    
    // CASO B: Es una respuesta de BOTÓN
    else if (message?.type === 'interactive') {
      const interactiveObject = message.interactive;
      if (interactiveObject.type === 'button_reply') {
        const buttonId = interactiveObject.button_reply.id;
        await this.handleButtonAction(buttonId, from, messageId);
      }
    }
  }

  // Manejador de los pasos del formulario (Médicos/Farmacias)
  async handleRegistrationFlow(to, text, messageId) {
    const session = userSessions[to];

    switch (session.step) {
      case 'AWAITING_NAME':
        session.data.nombre = text;
        if (session.type === 'medico') {
          session.step = 'AWAITING_SPECIALTY';
          await whatsappService.sendMessage(to, "Entendido. ¿Cuál es la especialidad del médico? 🎓", messageId);
        } else {
          session.step = 'AWAITING_ADDRESS';
          await whatsappService.sendMessage(to, "Gracias. Ahora, por favor ingresa la dirección de la farmacia: 📍", messageId);
        }
        break;

      case 'AWAITING_SPECIALTY':
        session.data.especialidad = text;
        session.step = 'AWAITING_ADDRESS';
        await whatsappService.sendMessage(to, "Excelente. Finalmente, ingresa la dirección del consultorio: 📍", messageId);
        break;

      case 'AWAITING_ADDRESS':
        session.data.direccion = text;
        // Aquí podrías guardar 'session.data' en tu base de datos SQL
        await whatsappService.sendMessage(to, "¡Gracias! Toda la información ha sido recolectada. El equipo de sistemas se contactará contigo cuando el registro esté creado en AROPHARMA. ✅", messageId);
        delete userSessions[to]; // Finalizamos la sesión
        break;
    }
  }

  async handleButtonAction(buttonId, to, messageId) {
    let responseText = '';

    switch (buttonId) {
      case 'option_1':
        const registrationButtons = [
          { type: 'reply', reply: { id: 'reg_medico', title: 'Médico 👨‍⚕️' } },
          { type: 'reply', reply: { id: 'reg_farmacia', title: 'Farmacia 🏥' } }
        ];
        await whatsappService.sendInteractiveButtons(to, "¡Perfecto! ¿Qué deseas registrar hoy?", registrationButtons);
        return; // Retornamos para evitar el sendMessage vacío al final

      case 'reg_medico':
        userSessions[to] = { step: 'AWAITING_NAME', type: 'medico', data: {} };
        responseText = "Iniciemos el registro. ¿Cuál es el nombre completo del médico? 📝";
        break;

      case 'reg_farmacia':
        userSessions[to] = { step: 'AWAITING_NAME', type: 'farmacia', data: {} };
        responseText = "Iniciemos el registro. ¿Cuál es el nombre de la farmacia? 📝";
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

  isGreeting(message) {
    const greetings = ["hola","buenas","buenas noches","buenas tardes","buenos dias","que tal"];
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
          title: 'Creacion' // 20 caracteres exactos
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'option_2',
          title: 'Información 💡' // 14 caracteres
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'option_3',
          title: 'Hablar con Humano 🙋' // 19 caracteres
        }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, "¿En qué te puedo ayudar?", menuButtons);
  }

  async sendMedia(to, messageId) {
    const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png';
    const caption = 'Esto es una imagen';
    await whatsappService.sendMediaMessage(to, 'image', mediaUrl, caption, messageId);
  }
}

module.exports = new MessageHandler();