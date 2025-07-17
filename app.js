const express = require("express");
const dotenv = require("dotenv");
const sequelize = require("./config/database");
const { attempSynchronization } = require("./utils/initDatabase");
const router = require("./services/routes");
const authRoutes = require("./services/authRoutes");
const path = require("path");
const { exchangeToken } = require("./middlewares/checkPrivilege");

const app = express();

app.use("/attachments", express.static(path.join(__dirname, "attachments")));

dotenv.config();
const port = process.env.PORT;

app.use(express.json());
// app.use(httpLogger);

app.use("/api/client", authRoutes);
app.use("/api/service", exchangeToken(), router);
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
