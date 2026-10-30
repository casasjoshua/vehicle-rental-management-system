
const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

console.log("dashboardController exports:", Object.keys(dashboardController));
console.log("authMiddleware type:", typeof authMiddleware);
console.log(
  "authMiddleware exports:",
  typeof authMiddleware === "object" && authMiddleware !== null
    ? Object.keys(authMiddleware)
    : "direct export"
);

const getDashboardStats =
  typeof dashboardController === "function"
    ? dashboardController
    : dashboardController.getDashboardStats;

const verifyToken =
  typeof authMiddleware === "function"
    ? authMiddleware
    : authMiddleware.verifyToken;

console.log("getDashboardStats type:", typeof getDashboardStats);
console.log("verifyToken type:", typeof verifyToken);

if (typeof getDashboardStats !== "function") {
  throw new Error(
    "getDashboardStats is not a function. Check dashboardController.js exports."
  );
}

if (typeof verifyToken !== "function") {
  throw new Error(
    "verifyToken is not a function. Check authMiddleware.js exports."
  );
}

router.get("/stats", verifyToken, getDashboardStats);

module.exports = router;
