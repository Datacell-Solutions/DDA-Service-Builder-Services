// models/page.js
const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const SubmissionsStatus = sequelize.define(
  "SubmissionsStatus",
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
    submissionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: 'Submissions',
        key: 'dguid',
      },
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'DRAFT'
    },
    comment: {
      type: DataTypes.STRING(1024),
      allowNull: true,
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
    tableName: "SubmissionsStatus",
    timestamps: false, // Disable timestamps
    defaultScope: {
      attributes: { exclude: ["id", "submissionId", "createdBy", "updatedAt", "updatedBy"] },
    },
  }
);
module.exports = SubmissionsStatus;
