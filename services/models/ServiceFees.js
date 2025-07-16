// models/page.js
const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const ServiceFees = sequelize.define(
  "ServiceFees",
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
    titleEn: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    titleAr: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    descriptionEn: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    descriptionAr: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    descriptionAr: {
      type: DataTypes.STRING(255),
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
    tableName: "ServiceFees",
    timestamps: false, // Disable timestamps
    defaultScope: {
      attributes: { exclude: ["id", "serviceId", "createdAt", "createdBy", "updatedAt", "updatedBy"] },
    },
  }
);
module.exports = ServiceFees;
