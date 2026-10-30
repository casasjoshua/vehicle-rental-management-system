
module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    "Vehicle",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      brand: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      plateNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        field: "plate_number",
      },
      vehicleType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "vehicle_type",
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1900,
          max: 2100,
        },
      },
      seats: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          min: 1,
        },
      },
      dailyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "daily_rate",
        validate: {
          min: 0,
        },
      },
      status: {
        type: DataTypes.ENUM(
          "AVAILABLE",
          "UNAVAILABLE",
          "MAINTENANCE"
        ),
        allowNull: false,
        defaultValue: "AVAILABLE",
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "image_url",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "vehicles",
      underscored: true,
    }
  );

  return Vehicle;
};
