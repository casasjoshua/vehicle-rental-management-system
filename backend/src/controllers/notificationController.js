
const { Notification, User } = require("../models");

// GET /api/notifications
// Get notifications belonging to the logged-in user.
async function getMyNotifications(req, res, next) {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100.",
      });
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: { userId: req.user.id },
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset: (page - 1) * limit,
    });

    const unreadCount = await Notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: rows,
      unreadCount,
      pagination: {
        totalItems: count,
        currentPage: page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/notifications/:id/read
// Mark one of the user's notifications as read.
async function markNotificationAsRead(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    if (!notification.isRead) {
      await notification.update({ isRead: true });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/notifications/read-all
// Mark all notifications belonging to the user as read.
async function markAllNotificationsAsRead(req, res, next) {
  try {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isRead: false,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      updatedCount,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/notifications/:id
// Delete one of the user's notifications.
async function deleteNotification(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    await notification.destroy();

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/notifications
// Staff or admins can send a notification to a specific user.
async function createNotification(req, res, next) {
  try {
    const { userId, title, message, bookingId = null } = req.body;

    if (
      userId === undefined ||
      !Number.isInteger(Number(userId)) ||
      Number(userId) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid userId is required.",
      });
    }

    if (typeof title !== "string" || !title.trim() || title.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: "Title is required and must not exceed 150 characters.",
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "A notification message is required.",
      });
    }

    const recipient = await User.findByPk(Number(userId));

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient user not found.",
      });
    }

    const notificationData = {
      userId: Number(userId),
      title: title.trim(),
      message: message.trim(),
    };

    if (bookingId !== null) {
      if (
        !Number.isInteger(Number(bookingId)) ||
        Number(bookingId) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "bookingId must be a positive integer or null.",
        });
      }

      notificationData.bookingId = Number(bookingId);
    }

    const notification = await Notification.create(notificationData);

    return res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
};
