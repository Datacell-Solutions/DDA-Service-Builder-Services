// models/page.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/database");
const bcrypt = require("bcryptjs");

const Clients = sequelize.define(
  "AppClients",
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
      unique: true,
    },
    clientSecret: {
      type: DataTypes.STRING(500),
      allowNull: true,
      set(value) {
        // Hash the clientSecret before saving
        const hashedSecret = bcrypt.hashSync(value, 10); // 10 rounds of salt
        this.setDataValue("clientSecret", hashedSecret);
      },
    },
    clientScope: {
      type: DataTypes.STRING(2056),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1,
    },
    createDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createUser: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updateDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updateUser: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "AppClients",
    timestamps: false, // Disable timestamps
  }
);
module.exports = Clients;
