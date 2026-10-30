
const { User, Vehicle, Booking } = require("../models");

async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let stats = {};

    if (role === "ADMIN") {
      const [
        totalVehicles,
        totalBookings,
        totalCustomers,
        pendingBookings,
        confirmedBookings,
        completedBookings,
      ] = await Promise.all([
        Vehicle.count(),

        Booking.count(),

        User.count({
          where: { role: "CUSTOMER" },
        }),

        Booking.count({
          where: { status: "PENDING" },
        }),

        Booking.count({
          where: { status: "CONFIRMED" },
        }),

        Booking.findAll({
          where: { status: "COMPLETED" },
          attributes: ["totalAmount"],
        }),
      ]);

      const revenue = completedBookings.reduce(
        (total, booking) =>
          total + Number(booking.totalAmount || 0),
        0
      );

      stats = {
        totalVehicles,
        totalBookings,
        totalCustomers,
        revenue,
        pendingBookings,
        confirmedBookings,
      };
    } else if (role === "STAFF") {
      const [
        totalVehicles,
        totalBookings,
        pendingBookings,
        confirmedBookings,
      ] = await Promise.all([
        Vehicle.count(),

        Booking.count(),

        Booking.count({
          where: { status: "PENDING" },
        }),

        Booking.count({
          where: { status: "CONFIRMED" },
        }),
      ]);

      stats = {
        totalVehicles,
        totalBookings,
        pendingBookings,
        confirmedBookings,
      };
    } else if (role === "CUSTOMER") {
      const [
        myBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
      ] = await Promise.all([
        Booking.count({
          where: { userId },
        }),

        Booking.count({
          where: { userId, status: "PENDING" },
        }),

        Booking.count({
          where: { userId, status: "CONFIRMED" },
        }),

        Booking.findAll({
          where: {
            userId,
            status: "COMPLETED",
          },
          attributes: ["totalAmount"],
        }),
      ]);

      const totalSpent = completedBookings.reduce(
        (total, booking) =>
          total + Number(booking.totalAmount || 0),
        0
      );

      stats = {
        myBookings,
        totalSpent,
        pendingBookings,
        confirmedBookings,
      };
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role.",
      });
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
};
