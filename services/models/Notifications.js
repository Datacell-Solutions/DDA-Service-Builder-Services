// models/page.js
const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../config/database");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const Notifications = sequelize.define(
  "Notifications",
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
      defaultValue: uuidv4,
    },
    serviceId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: 'Services',
        key: 'dguid',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isRead: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW,
    },
    createdBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "Notifications",
    timestamps: false, // Disable timestamps
    defaultScope: {
      attributes: { exclude: ["id", "serviceId", "createdAt", "createdBy", "updatedAt", "updatedBy"] },
    },
  }
);
module.exports = Notifications;
