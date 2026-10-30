
const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// Check that middleware imports are functions.
if (typeof authenticate !== "function") {
  throw new TypeError(
    "authMiddleware.js must export authenticate as a function."
  );
}

if (typeof allowRoles !== "function") {
  throw new TypeError(
    "roleMiddleware.js must export allowRoles as a function."
  );
}

// Only authenticated ADMIN and STAFF users can access reports.
router.use(authenticate);
router.use(allowRoles("ADMIN", "STAFF"));

router.get("/summary", reportController.getSummary);
router.get("/monthly", reportController.getMonthlyReport);
router.get("/bookings", reportController.getBookingReport);
router.get("/vehicles", reportController.getVehicleReport);
router.get("/users", reportController.getUserReport);

module.exports = router;
