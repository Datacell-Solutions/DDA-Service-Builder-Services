// models/page.js
const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const Services = sequelize.define(
  "Services",
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
    entityId: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    nameEn: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nameAr: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    serviceCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    DepartmentEn: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    DepartmentAr: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    SectorEn: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    SectorAr: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    DescriptionEn: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    DescriptionAr: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    ServiceFees: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    ServiceChannelApply: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ServiceChannelDeliver: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ServiceChannelPay: {
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
    tableName: "Services",
    timestamps: false, // Disable timestamps
    defaultScope: {
      attributes: { exclude: ["id", "createdAt", "createdBy", "updatedAt", "updatedBy"] },
    },
  }
);
module.exports = Services;
