
const express = require("express");

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
} = require("../controllers/notificationController");

const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// All notification routes require authentication.
router.use(authenticate);

// Get the logged-in user's notifications.
router.get("/", getMyNotifications);

// Mark all notifications as read.
// Keep this route before /:id/read.
router.patch("/read-all", markAllNotificationsAsRead);

// Mark one notification as read.
router.patch("/:id/read", markNotificationAsRead);

// Delete one of the logged-in user's notifications.
router.delete("/:id", deleteNotification);

// Staff and admins can create notifications for users.
router.post(
  "/",
  allowRoles("STAFF", "ADMIN"),
  createNotification
);

module.exports = router;
