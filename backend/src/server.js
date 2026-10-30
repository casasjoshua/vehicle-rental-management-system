
require("dotenv").config();

const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connection established successfully.");

    // Development only: create tables and update their structure.
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
    } else {
      // In production, manage schema changes through migrations.
      await sequelize.sync();
    }

    console.log("Database models synchronized successfully.");

    app.listen(PORT, () => {
      console.log(
        `Vehicle Rental API running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Unable to start the application:", error.message);
    process.exit(1);
  }
}

startServer();
