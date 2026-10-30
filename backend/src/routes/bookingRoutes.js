
const express = require("express");

const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
} = require("../controllers/bookingController");

const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// All booking endpoints require login.
router.use(authenticate);

// CUSTOMER: Create a booking request.
router.post(
  "/",
  allowRoles("CUSTOMER"),
  createBooking
);

// CUSTOMER: View their own bookings.
// Keep this route before "/:id".
router.get(
  "/my-bookings",
  allowRoles("CUSTOMER"),
  getMyBookings
);

// STAFF / ADMIN: View all bookings.
router.get(
  "/",
  allowRoles("STAFF", "ADMIN"),
  getAllBookings
);

// CUSTOMER: Cancel their own pending booking.
router.patch(
  "/:id/cancel",
  allowRoles("CUSTOMER"),
  cancelBooking
);

// STAFF / ADMIN: Confirm, reject, or complete a booking.
router.patch(
  "/:id/status",
  allowRoles("STAFF", "ADMIN"),
  updateBookingStatus
);

// CUSTOMER can view their own booking.
// STAFF / ADMIN can view any booking.
router.get("/:id", getBookingById);

module.exports = router;
