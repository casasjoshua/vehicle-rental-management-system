
const { Op } = require("sequelize");
const {
  sequelize,
  Booking,
  Vehicle,
  User,
  BookingStatusHistory,
  Notification,
} = require("../models");

// Calculate rental days inclusively using UTC dates.
function calculateRentalDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  return Math.floor((end - start) / 86400000) + 1;
}

function isValidDateString(value) {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function generateBookingNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `VR-${timestamp}-${random}`;
}

// Check whether a vehicle already has a confirmed booking
// that overlaps the requested dates.
async function hasDateConflict(vehicleId, startDate, endDate, transaction) {
  const conflictingBooking = await Booking.findOne({
    where: {
      vehicleId,
      status: "CONFIRMED",
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate },
    },
    transaction,
  });

  return Boolean(conflictingBooking);
}

// CUSTOMER: Create a booking request.
async function createBooking(req, res, next) {
  try {
    const {
      vehicleId,
      startDate,
      endDate,
      pickupLocation,
      returnLocation,
      customerNote,
    } = req.body;

    if (
      !vehicleId ||
      !Number.isInteger(Number(vehicleId)) ||
      Number(vehicleId) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid vehicleId is required.",
      });
    }

    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Dates must use the valid YYYY-MM-DD format.",
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be on or after start date.",
      });
    }

    if (
      typeof pickupLocation !== "string" ||
      !pickupLocation.trim() ||
      typeof returnLocation !== "string" ||
      !returnLocation.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Pickup and return locations are required.",
      });
    }

    if (
      customerNote !== undefined &&
      customerNote !== null &&
      typeof customerNote !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer note must be text.",
      });
    }

    const vehicle = await Vehicle.findByPk(Number(vehicleId));

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    if (vehicle.status !== "AVAILABLE") {
      return res.status(409).json({
        success: false,
        message: "This vehicle is not available for booking.",
      });
    }

    const numberOfDays = calculateRentalDays(startDate, endDate);
    const dailyRate = Number(vehicle.dailyRate);

    if (!Number.isFinite(dailyRate) || dailyRate < 0) {
      return res.status(500).json({
        success: false,
        message: "The vehicle has an invalid daily rental rate.",
      });
    }

    const totalAmount = (dailyRate * numberOfDays).toFixed(2);

    const booking = await Booking.create({
      bookingNumber: generateBookingNumber(),
      userId: req.user.id,
      vehicleId: vehicle.id,
      startDate,
      endDate,
      pickupLocation: pickupLocation.trim(),
      returnLocation: returnLocation.trim(),
      numberOfDays,
      dailyRate: dailyRate.toFixed(2),
      totalAmount,
      status: "PENDING",
      customerNote: customerNote?.trim() || null,
    });

    return res.status(201).json({
      success: true,
      message: "Booking request submitted successfully.",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

// CUSTOMER: View only their own bookings.
async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: [
            "id",
            "name",
            "brand",
            "model",
            "plateNumber",
            "dailyRate",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      count: bookings.length,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
}

// STAFF / ADMIN: View all bookings.
async function getAllBookings(req, res, next) {
  try {
    const where = {};

    if (req.query.status) {
      const allowedStatuses = [
        "PENDING",
        "CONFIRMED",
        "REJECTED",
        "CANCELLED",
        "COMPLETED",
      ];

      const status = String(req.query.status).toUpperCase();

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status filter.",
        });
      }

      where.status = status;
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "fullName", "email", "phone"],
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: [
            "id",
            "name",
            "brand",
            "model",
            "plateNumber",
            "dailyRate",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      count: bookings.length,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
}

// CUSTOMER: View one of their bookings.
// STAFF / ADMIN: View any booking.
async function getBookingById(req, res, next) {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["id", "fullName", "email", "phone"],
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: [
            "id",
            "name",
            "brand",
            "model",
            "plateNumber",
            "dailyRate",
          ],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const isStaff = ["ADMIN", "STAFF"].includes(req.user.role);

    if (!isStaff && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this booking.",
      });
    }

    return res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

// CUSTOMER: Cancel their own pending booking.
async function cancelBooking(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const booking = await Booking.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!booking) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.userId !== req.user.id) {
      await transaction.rollback();

      return res.status(403).json({
        success: false,
        message: "You can only cancel your own bookings.",
      });
    }

    if (booking.status !== "PENDING") {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be cancelled.",
      });
    }

    booking.status = "CANCELLED";
    await booking.save({ transaction });

    await BookingStatusHistory.create(
      {
        bookingId: booking.id,
        oldStatus: "PENDING",
        newStatus: "CANCELLED",
        changedBy: req.user.id,
        note: "Cancelled by customer.",
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: "Booking cancelled successfully.",
      data: { booking },
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

// STAFF / ADMIN: Confirm, reject, or complete a booking.
async function updateBookingStatus(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const { status, staffNote } = req.body;
    const allowedStatuses = ["CONFIRMED", "REJECTED", "COMPLETED"];

    if (!allowedStatuses.includes(status)) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Status must be CONFIRMED, REJECTED, or COMPLETED.",
      });
    }

    if (
      staffNote !== undefined &&
      staffNote !== null &&
      typeof staffNote !== "string"
    ) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Staff note must be text.",
      });
    }

    const booking = await Booking.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!booking) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const previousStatus = booking.status;

    const validTransition =
      (previousStatus === "PENDING" &&
        ["CONFIRMED", "REJECTED"].includes(status)) ||
      (previousStatus === "CONFIRMED" && status === "COMPLETED");

    if (!validTransition) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: `Cannot change booking status from ${previousStatus} to ${status}.`,
      });
    }

    if (status === "CONFIRMED") {
      const conflict = await hasDateConflict(
        booking.vehicleId,
        booking.startDate,
        booking.endDate,
        transaction
      );

      if (conflict) {
        await transaction.rollback();

        return res.status(409).json({
          success: false,
          message:
            "This vehicle already has a confirmed booking for overlapping dates.",
        });
      }
    }

    booking.status = status;
    booking.staffNote = staffNote?.trim() || null;
    booking.reviewedBy = req.user.id;
    booking.reviewedAt = new Date();

    await booking.save({ transaction });

    await BookingStatusHistory.create(
      {
        bookingId: booking.id,
        oldStatus: previousStatus,
        newStatus: status,
        changedBy: req.user.id,
        note: staffNote?.trim() || null,
      },
      { transaction }
    );

    await Notification.create(
      {
        userId: booking.userId,
        bookingId: booking.id,
        title: `Booking ${status.toLowerCase()}`,
        message: `Your booking ${booking.bookingNumber} is now ${status.toLowerCase()}.`,
        isRead: false,
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully.`,
      data: { booking },
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
};
