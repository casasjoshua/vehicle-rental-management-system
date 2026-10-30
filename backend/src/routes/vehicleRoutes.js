
const express = require("express");

const {
  getAllVehicles,
  getAvailableVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
} = require("../controllers/vehicleController");

const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Public routes
router.get("/", getAllVehicles);
router.get("/available", getAvailableVehicles);
router.get("/:id", getVehicleById);

// STAFF / ADMIN routes
router.post(
  "/",
  authenticate,
  allowRoles("STAFF", "ADMIN"),
  createVehicle
);

router.put(
  "/:id",
  authenticate,
  allowRoles("STAFF", "ADMIN"),
  updateVehicle
);

router.patch(
  "/:id/status",
  authenticate,
  allowRoles("STAFF", "ADMIN"),
  updateVehicleStatus
);

// ADMIN only
router.delete(
  "/:id",
  authenticate,
  allowRoles("ADMIN"),
  deleteVehicle
);

module.exports = router;
