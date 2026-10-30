
const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  updatePassword,
} = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get current logged-in user
router.get("/me", authenticate, getMe);

// Logout
router.post("/logout", authenticate, logout);

// Update Profile
router.put("/profile", authenticate, updateProfile);

// Change Password
router.put("/password", authenticate, updatePassword);

module.exports = router;
