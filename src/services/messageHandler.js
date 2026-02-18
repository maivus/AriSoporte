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

    // --- LÓGICA DE FLUJO DE REGISTRO CON CONFIRMACIONES ---
    if (message?.type === 'text' && userSessions[from]) {
        // Si hay una sesión activa, derivamos a la validación de texto
        await this.handleRegistrationFlow(from, message.text.body, messageId);
        return; 
    }
    //PRUEBA CON KRAKEN
    // CASO A: Es un mensaje de TEXTO (Saludo o comandos)
    if (message?.type === 'text') {
      const messageBody = message.text.body;
      const inComingMessage = messageBody.toLowerCase().trim();

      if (this.isGreeting(inComingMessage)) {
        await this.sendWelcomeMessage(from, messageId, senderName);
        await this.sendWelcomeMenu(from);
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
    const cleanText = text.trim();

    // Si el usuario está en un paso de confirmación, ignoramos nuevos textos hasta que use los botones
    if (session.step.includes('CONFIRMING')) {
      await whatsappService.sendMessage(to, "Por favor, usa los botones de arriba para confirmar o corregir la información. 👆", messageId);
      return;
    }

    switch (session.step) {
      case 'AWAITING_NAME':
        if (!/^[a-zA-ZÀ-ÿ\s]{3,}$/.test(cleanText)) {
          await whatsappService.sendMessage(to, "❌ Nombre no válido. Por favor usa solo letras (mínimo 3).", messageId);
          return;
        }
        session.tempData = cleanText;
        session.step = 'CONFIRMING_NAME';
        await this.askConfirmation(to, `¿Confirmas que el nombre es:\n*${cleanText}*?`, 'name');
        break;

      case 'AWAITING_SPECIALTY':
        if (cleanText.length < 3) {
          await whatsappService.sendMessage(to, "❌ Por favor, indica una especialidad válida.", messageId);
          return;
        }
        session.tempData = cleanText;
        session.step = 'CONFIRMING_SPECIALTY';
        await this.askConfirmation(to, `¿La especialidad es:\n*${cleanText}*?`, 'specialty');
        break;

      case 'AWAITING_ADDRESS':
        // Validación flexible: Permite letras, números y caracteres especiales comunes en direcciones (#, ., -, ,)
        if (cleanText.length < 5) {
          await whatsappService.sendMessage(to, "❌ La dirección es muy corta. Por favor sé más específico.", messageId);
          return;
        }
        session.tempData = cleanText;
        session.step = 'CONFIRMING_ADDRESS';
        await this.askConfirmation(to, `¿Confirmas la dirección:\n*${cleanText}*?`, 'address');
        break;
    }
  }

  async askConfirmation(to, bodyText, type) {
    const buttons = [
      { type: 'reply', reply: { id: `yes_${type}`, title: 'Sí, es correcto ✅' } },
      { type: 'reply', reply: { id: `no_${type}`, title: 'No, corregir ✍️' } }
    ];
    await whatsappService.sendInteractiveButtons(to, bodyText, buttons);
  }



  async handleButtonAction(buttonId, to, messageId) {
    const session = userSessions[to];

    switch (buttonId) {
      case 'option_1':
        const registrationButtons = [
          { type: 'reply', reply: { id: 'reg_medico', title: 'Médico 👨‍⚕️' } },
          { type: 'reply', reply: { id: 'reg_farmacia', title: 'Farmacia 🏥' } }
        ];
        await whatsappService.sendInteractiveButtons(to, "¡Perfecto! ¿Qué deseas registrar hoy?", registrationButtons);
        break;

      case 'reg_medico':
        userSessions[to] = { step: 'AWAITING_NAME', type: 'medico', data: {} };
        await whatsappService.sendMessage(to, "Iniciemos. ¿Cuál es el nombre completo del médico? 📝");
        break;

      case 'reg_farmacia':
        userSessions[to] = { step: 'AWAITING_NAME', type: 'farmacia', data: {} };
        await whatsappService.sendMessage(to, "Iniciemos. ¿Cuál es el nombre de la farmacia? 📝");
        break;

      // --- MANEJO DE CONFIRMACIONES ---
      
      // Confirmación de Nombre
      case 'yes_name':
        session.data.nombre = session.tempData;
        if (session.type === 'medico') {
          session.step = 'AWAITING_SPECIALTY';
          await whatsappService.sendMessage(to, "¡Excelente! Ahora, ¿cuál es su especialidad? 🎓");
        } else {
          session.step = 'AWAITING_ADDRESS';
          await whatsappService.sendMessage(to, "¡Excelente! Ahora, ingresa la dirección de la farmacia: 📍");
        }
        break;

      // Confirmación de Especialidad
      case 'yes_specialty':
        session.data.especialidad = session.tempData;
        session.step = 'AWAITING_ADDRESS';
        await whatsappService.sendMessage(to, "Entendido. Finalmente, ingresa la dirección del consultorio: 📍");
        break;

      // Confirmación de Dirección (FINAL)
      case 'yes_address':
        session.data.direccion = session.tempData;
        await whatsappService.sendMessage(to, "¡Gracias! Toda la información ha sido recolectada. El equipo de sistemas se contactará contigo cuando el registro esté creado en AROPHARMA. ✅");
        await this.sendWelcomeMenu(to);
        delete userSessions[to];
        break;

      // Casos de "No, corregir"
      case 'no_name':
        session.step = 'AWAITING_NAME';
        await whatsappService.sendMessage(to, "De acuerdo. Escribe el nombre nuevamente: 📝");
        break;
      case 'no_specialty':
        session.step = 'AWAITING_SPECIALTY';
        await whatsappService.sendMessage(to, "De acuerdo. Escribe la especialidad nuevamente: 🎓");
        break;
      case 'no_address':
        session.step = 'AWAITING_ADDRESS';
        await whatsappService.sendMessage(to, "De acuerdo. Escribe la dirección nuevamente: 📍");
        break;

      // ... Resto de opciones del menú inicial (option_2, option_3)
    }
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
          title: 'Creacion' //  caracteres exactos
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