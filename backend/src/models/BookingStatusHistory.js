
module.exports = (sequelize, DataTypes) => {
  const BookingStatusHistory = sequelize.define(
    "BookingStatusHistory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      oldStatus: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: "old_status",
      },
      newStatus: {
        type: DataTypes.STRING(30),
        allowNull: false,
        field: "new_status",
      },
      changedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "changed_by",
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "booking_status_history",
      underscored: true,
    }
  );

  return BookingStatusHistory;
};
