
const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

const User = require("./User")(sequelize, DataTypes);
const Vehicle = require("./Vehicle")(sequelize, DataTypes);
const Booking = require("./Booking")(sequelize, DataTypes);
const Notification = require("./Notification")(
  sequelize,
  DataTypes
);
const BookingStatusHistory = require(
  "./BookingStatusHistory"
)(sequelize, DataTypes);

// One customer can have many bookings.
User.hasMany(Booking, {
  foreignKey: {
    name: "userId",
    field: "user_id",
    allowNull: false,
  },
  as: "bookings",
  onDelete: "RESTRICT",
});

Booking.belongsTo(User, {
  foreignKey: {
    name: "userId",
    field: "user_id",
    allowNull: false,
  },
  as: "customer",
});

// One vehicle can have many bookings over time.
Vehicle.hasMany(Booking, {
  foreignKey: {
    name: "vehicleId",
    field: "vehicle_id",
    allowNull: false,
  },
  as: "bookings",
  onDelete: "RESTRICT",
});

Booking.belongsTo(Vehicle, {
  foreignKey: {
    name: "vehicleId",
    field: "vehicle_id",
    allowNull: false,
  },
  as: "vehicle",
});

// The staff member who reviews a booking.
User.hasMany(Booking, {
  foreignKey: {
    name: "reviewedBy",
    field: "reviewed_by",
    allowNull: true,
  },
  as: "reviewedBookings",
  onDelete: "SET NULL",
});

Booking.belongsTo(User, {
  foreignKey: {
    name: "reviewedBy",
    field: "reviewed_by",
    allowNull: true,
  },
  as: "reviewer",
});

// Customer notifications.
User.hasMany(Notification, {
  foreignKey: {
    name: "userId",
    field: "user_id",
    allowNull: false,
  },
  as: "notifications",
  onDelete: "CASCADE",
});

Notification.belongsTo(User, {
  foreignKey: {
    name: "userId",
    field: "user_id",
    allowNull: false,
  },
  as: "user",
});

Booking.hasMany(Notification, {
  foreignKey: {
    name: "bookingId",
    field: "booking_id",
    allowNull: true,
  },
  as: "notifications",
  onDelete: "SET NULL",
});

Notification.belongsTo(Booking, {
  foreignKey: {
    name: "bookingId",
    field: "booking_id",
    allowNull: true,
  },
  as: "booking",
});

// Audit history for booking status changes.
Booking.hasMany(BookingStatusHistory, {
  foreignKey: {
    name: "bookingId",
    field: "booking_id",
    allowNull: false,
  },
  as: "statusHistory",
  onDelete: "CASCADE",
});

BookingStatusHistory.belongsTo(Booking, {
  foreignKey: {
    name: "bookingId",
    field: "booking_id",
    allowNull: false,
  },
  as: "booking",
});

User.hasMany(BookingStatusHistory, {
  foreignKey: {
    name: "changedBy",
    field: "changed_by",
    allowNull: true,
  },
  as: "statusChanges",
  onDelete: "SET NULL",
});

BookingStatusHistory.belongsTo(User, {
  foreignKey: {
    name: "changedBy",
    field: "changed_by",
    allowNull: true,
  },
  as: "changedByUser",
});

module.exports = {
  sequelize,
  User,
  Vehicle,
  Booking,
  Notification,
  BookingStatusHistory,
};
