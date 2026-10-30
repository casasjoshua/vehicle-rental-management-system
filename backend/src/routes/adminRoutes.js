
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// All routes below require an authenticated ADMIN.
router.use(authenticate, allowRoles("ADMIN"));

// List users
router.get("/users", adminController.getAllUsers);

// Create user
router.post("/users", adminController.createUser);

// Update user
router.patch("/users/:id", adminController.updateUser);

module.exports = router;
