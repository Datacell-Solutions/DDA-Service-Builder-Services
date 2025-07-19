const {
  Notifications,
} = require("../models");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHandler");

const addNotification = async (req, res) => {
  const { userId, serviceId, title, message } = req.body;
  try {
    const notification = await Notifications.create({ serviceId, title, message, userId });
    res.json(successResponse(notification.dguid));
  } catch (error) {
    res.json(errorResponse("Failed to create notification.", 500));
  }
};

const readNotification = async (req, res) => {
  const { notificationId } = req.params;
  try {
    await Notifications.update({ isRead: true }, { where: { dguid: notificationId } });
    res.json(successResponse(true));
  } catch (error) {
    res.json(errorResponse("Failed to update notification.", 500));
  }
};

const getUserNotifications = async (req, res) => {
  const { userId } = req.body;
  try {
    const notifications = await Notifications.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    res.json(successResponse(notifications));
  } catch (error) {
    res.json(errorResponse("Failed to fetch notifications.", 500));
  }
};

module.exports = {
  addNotification,
  readNotification,
  getUserNotifications
};
