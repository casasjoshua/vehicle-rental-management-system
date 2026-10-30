
const { Booking, BookingStatusHistory, User } = require("../models");

// GET /api/booking-status-history/booking/:bookingId
// Get status history for a specific booking
async function getBookingStatusHistory(req, res, next) {
  try {
    const bookingId = Number(req.params.bookingId);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    // Customers may view only their own booking history.
    if (
      req.user.role === "CUSTOMER" &&
      Number(booking.userId) !== Number(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this booking history.",
      });
    }

    const history = await BookingStatusHistory.findAll({
      where: { bookingId },
      include: [
        {
          model: User,
          as: "changedByUser",
          attributes: ["id", "fullName", "role"],
          required: false,
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Booking status history retrieved successfully.",
      data: history,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/booking-status-history
// Staff and admins can view history across all bookings.
async function getAllBookingStatusHistory(req, res, next) {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100.",
      });
    }

    const { count, rows } = await BookingStatusHistory.findAndCountAll({
      include: [
        {
          model: Booking,
          as: "booking",
          attributes: ["id", "bookingNumber", "userId", "status"],
          required: true,
        },
        {
          model: User,
          as: "changedByUser",
          attributes: ["id", "fullName", "role"],
          required: false,
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset: (page - 1) * limit,
    });

    return res.status(200).json({
      success: true,
      message: "Booking status history retrieved successfully.",
      data: rows,
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

module.exports = {
  getBookingStatusHistory,
  getAllBookingStatusHistory,
};
