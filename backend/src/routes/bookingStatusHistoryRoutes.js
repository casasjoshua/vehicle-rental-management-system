
const express = require("express");

const {
  getBookingStatusHistory,
  getAllBookingStatusHistory,
} = require("../controllers/bookingStatusHistoryController");

const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// All routes require authentication.
router.use(authenticate);

// Staff and admins can view history for all bookings.
router.get(
  "/",
  allowRoles("STAFF", "ADMIN"),
  getAllBookingStatusHistory
);

// Customers can view their own history.
// Staff and admins can view any booking's history.
router.get(
  "/booking/:bookingId",
  allowRoles("CUSTOMER", "STAFF", "ADMIN"),
  getBookingStatusHistory
);

module.exports = router;
