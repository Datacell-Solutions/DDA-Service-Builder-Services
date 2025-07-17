// models/page.js
const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const ServiceDesigns = sequelize.define(
  "ServiceDesigns",
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
    figmaDesignLink: {
      type: DataTypes.STRING(4000),
      allowNull: true,
    },
    figmaPreviewLink: {
      type: DataTypes.STRING(4000),
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
    tableName: "ServiceDesigns",
    timestamps: false, // Disable timestamps
    defaultScope: {
      attributes: { exclude: ["id", "createdAt", "createdBy", "updatedAt", "updatedBy"] },
    },
  }
);
module.exports = ServiceDesigns;
