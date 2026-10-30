
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fullName: {
        type: DataTypes.STRING(150),
        allowNull: false,
        field: "full_name",
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "password_hash",
      },
      role: {
        type: DataTypes.ENUM("ADMIN", "STAFF", "CUSTOMER"),
        allowNull: false,
        defaultValue: "CUSTOMER",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "users",
      underscored: true,
    }
  );

  return User;
};
