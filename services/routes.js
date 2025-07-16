// routes/index.js
const express = require('express');
const router = express.Router();

// Import all controllers
const Clients = require('./controllers/userController');
const Service = require('./controllers/serviceController');

// Middleware for common error handling and validation can be added here
// const checkPrivilege = require('../../middlewares/checkPrivilege');

// Template Routes
router.post('/Client/Login', Clients.getClientToken);

router.post('/service/add', Service.addService);
router.post('/service/update/:serviceId', Service.updateService);
router.get('/service/getAll', Service.getAllServices);
router.get('/service/get/:serviceId', Service.getService);
router.post('/service/submitUserAction', Service.submitUserAction);
router.get('/service/getSubmissionDetails/:submissionId', Service.getSubmissionDetails);
router.post("/service/addTestCases", Service.upload.single("file"), Service.addTestCases);
module.exports = router;