const express = require("express");
const dotenv = require("dotenv");
const sequelize = require("./config/database");
const { attempSynchronization } = require("./utils/initDatabase");

dotenv.config();
const port = process.env.PORT;

const app = express();

app.use(express.json());
// app.use(httpLogger);

// app.use('/authentication', authRoutes);

app.get("/initialize-database", attempSynchronization);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "✅ Connection to SQL Server has been established successfully."
    );
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
