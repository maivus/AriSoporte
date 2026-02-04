const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Definimos las rutas
router.get('/', webhookController.verifyWebhook);
router.post('/', webhookController.receiveWebhook);

module.exports = router;