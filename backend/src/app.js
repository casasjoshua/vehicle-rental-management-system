
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const bookingStatusHistoryRoutes = require("./routes/bookingStatusHistoryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://vehicle-rental-management-system-4ku4qythe.vercel.app",
  ...(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as Postman
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  })
);

// API health check
app.get("/api/vehicle-rental", (req, res) => {
  res.json({
    success: true,
    message: "Vehicle Rental API is running!",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Booking routes
app.use("/api/bookings", bookingRoutes);

// Vehicle routes
app.use("/api/vehicles", vehicleRoutes);

// Booking status history routes
app.use("/api/booking-status-history", bookingStatusHistoryRoutes);

// Notification routes
app.use("/api/notifications", notificationRoutes);

// Dashboard routes
app.use("/api/dashboard", dashboardRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// Reports routes
app.use("/api/reports", reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error("API Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An internal server error occurred."
        : err.message || "Internal server error.",
  });
});

module.exports = app;
