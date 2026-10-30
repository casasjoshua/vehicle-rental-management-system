
module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "Booking",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bookingNumber: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
        field: "booking_number",
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "start_date",
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "end_date",
      },
      pickupLocation: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "pickup_location",
      },
      returnLocation: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "return_location",
      },
      numberOfDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "number_of_days",
        validate: {
          min: 1,
        },
      },
      dailyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "daily_rate",
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: "total_amount",
      },
      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "CONFIRMED",
          "REJECTED",
          "CANCELLED",
          "COMPLETED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
      },
      customerNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "customer_note",
      },
      staffNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "staff_note",
      },
      reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "reviewed_by",
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "reviewed_at",
      },
    },
    {
      tableName: "bookings",
      underscored: true,
      validate: {
        validRentalDates() {
          if (
            this.startDate &&
            this.endDate &&
            this.endDate < this.startDate
          ) {
            throw new Error(
              "End date must be on or after start date."
            );
          }
        },
      },
    }
  );

  return Booking;
};
