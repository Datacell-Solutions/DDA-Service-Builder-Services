// models/page.js
const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const ServiceScreensDev = sequelize.define(
  "ServiceScreensDev",
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
      allowNull: true,
    },
    json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
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
    tableName: "ServiceScreensDev",
    timestamps: false, // Disable timestamps
    defaultScope: {
      attributes: { exclude: ["id", "createdAt", "createdBy", "updatedAt", "updatedBy"] },
    },
  }
);
module.exports = ServiceScreensDev;
