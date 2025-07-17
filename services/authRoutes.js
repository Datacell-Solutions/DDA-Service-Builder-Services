// routes/index.js
const express = require('express');
const router = express.Router();

// Import all controllers
const Clients = require('./controllers/userController');

// Template Routes
router.post('/Login', Clients.getClientToken);
module.exports = router;