// models/page.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");

const ClientSessions = sequelize.define(
  "AppSessions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    dguid: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    clientId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    clientScope: {
      type: DataTypes.STRING(2056),
      allowNull: false,
    },
    createDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "AppSessions",
    timestamps: false, // Disable timestamps
  }
);
module.exports = ClientSessions;
