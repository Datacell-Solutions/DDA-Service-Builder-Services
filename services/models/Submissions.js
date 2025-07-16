// models/page.js
const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const Submissions = sequelize.define(
  "Submissions",
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
    phaseKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "Submissions",
    timestamps: false, // Disable timestamps
    defaultScope: {
      attributes: { exclude: ["id", "serviceId", "createdAt", "createdBy", "updatedAt", "updatedBy"] },
    },
  }
);
module.exports = Submissions;
