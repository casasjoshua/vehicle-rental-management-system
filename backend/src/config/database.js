
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development"
    ? console.log
    : false,
  dialectOptions: {
    // Add SSL settings here only if your database host requires SSL.
  },
});

module.exports = sequelize;
