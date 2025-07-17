// routes/index.js
const express = require('express');
const router = express.Router();

// Import all controllers
const Clients = require('./controllers/userController');
const Service = require('./controllers/serviceController');

// Middleware for common error handling and validation can be added here
// const checkPrivilege = require('../../middlewares/checkPrivilege');

// Template Routes
router.post('/add', Service.addService);
router.post('/update/:serviceId', Service.updateService);
router.get('/getAll', Service.getAllServices);
router.get('/get/:serviceId', Service.getService);
router.post('/submitUserAction', Service.submitUserAction);
router.get('/getSubmissionDetails/:submissionId', Service.getSubmissionDetails);
router.post("/addTestCases", Service.upload.single("file"), Service.addTestCases);
module.exports = router;