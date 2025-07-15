// routes/index.js
const express = require('express');
const router = express.Router();

// Import all controllers
const Clients = require('./controllers/userController');

// Middleware for common error handling and validation can be added here
// const checkPrivilege = require('../../middlewares/checkPrivilege');

// Template Routes
router.post('/Client/Login', Clients.getClientToken);

module.exports = router;