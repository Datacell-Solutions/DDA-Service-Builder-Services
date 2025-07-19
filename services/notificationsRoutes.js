const express = require('express');
const router = express.Router();

const notificationsController = require('./controllers/notificationsController');
const { authorizeAPI } = require('../middlewares/authorizeAPI');
const { exchangeToken } = require('../middlewares/checkPrivilege');

router.post('/addNotification', authorizeAPI(), notificationsController.addNotification);
router.get('/readNotification/:notificationId', exchangeToken(), notificationsController.readNotification);
router.post('/getUserNotifications', exchangeToken(), notificationsController.getUserNotifications);
module.exports = router;