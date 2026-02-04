const express = require('express');
const config = require('./src/config/env');
const webhookRoutes = require('./src/routes/webhookRoutes');

const app = express();

// Middleware
app.use(express.json());

// Rutas
// Aquí le decimos que todo lo que llegue a la raíz ('/') lo maneje webhookRoutes
app.use('/', webhookRoutes);

// Servidor
app.listen(config.PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${config.PORT}`);
});