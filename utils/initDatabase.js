// models/index.js
const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database.js");
const { DataTypes } = require("sequelize");

// Auth
const Clients = require("../services/Authentication/models/client.js");
const Sessions = require("../services/Authentication/models/sessions.js");

const models = {
  Clients,
  Sessions,
};

async function attempSynchronization(req, res) {
  try {
    await sequelize.sync({ alter: true, force: true }); // use { force: true } to drop+recreate
    res.send("✅ All models synced to database schema.");
  } catch (err) {
    const logDir = path.join(__dirname, "../logs");

    // Ensure the logs folder exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const date = new Date();
    const formattedDate = `${String(date.getSeconds()).padStart(
      2,
      "0"
    )}-${String(date.getMinutes()).padStart(2, "0")}-${String(
      date.getHours()
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;

    const logFile = path.join(logDir, "sync-error-" + formattedDate + ".log");

    const logEntry = `
[${new Date().toISOString()}] Sync Error: ${err.message}
${err.stack || err.toString()}
--------------------------------------------------
`;

    fs.appendFileSync(logFile, logEntry, "utf8");

    res.status(500).send("❌ Error syncing models");
  }
}

module.exports = { attempSynchronization };
