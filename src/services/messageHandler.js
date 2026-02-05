const whatsappService = require('./whatsappService');

class messageHandler{
  async handleIncomingMessage(message, senderName){
    // Extraemos datos básicos
    const messageId = message.id;
    const from = message.from;

    // Log para ver que capturamos bien el nombre
      console.log(`Mensaje de ${senderName} (${from}): ${messageBody}`);
      console.log(`Procesando mensaje de ${from}: ${messageBody}`);

    if (message?.type === 'text'){
      // Transformamos el texto a todo minusculas
      const inComingmessage = message.text.body.toLowerCase().trim();

      // Enviamos los mensajes
      if(this.isGreeting(inComingmessage)){
        await this.sendWelcomeMessage(message.from,message.id, senderName)
      } else {
        const response = `Echo: ${message.text.body}`;
        // Extraemos datos básicos
        await whatsappService.sendMessage(message.from, response, message.id);
      }
      // Marcar como leído inmediatamente (Lógica de vistos)
      await whatsappService.markAsRead(messageId);
    }
  }

  isGreeting(message){
    const greetings = ["hola", "buenas", "buenas tardes", "buenas noches", "hola"];
    return greetings.includes(message);
  }

  async sendWelcomeMessage(to, messageId, senderName){
    const welcomeMessage = "Hola ${senderName}, gracias por ponerte en contacto conmigo." + 
    "¿En que te puedo ayudar? Estoy lista para ayudarte en cualquiera de tus necesidades."

    await whatsappService.sendMessage(to, welcomeMessage, messageId, senderName);
  }
}

module.exports = {
  messageHandler
};