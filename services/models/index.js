// models/index.js
const Clients = require("./client");
const DSessions = require("./sessions");
const Services = require("./Service.js");
const ServiceDocuments = require("./ServiceDocuments.js");
const ServiceFees = require("./ServiceFees.js");
const ServicePhases = require("./ServicePhases.js");

// Define associations
Services.hasMany(ServiceDocuments, { foreignKey: "serviceId", as: "documents" });
ServiceDocuments.belongsTo(Services, { foreignKey: "serviceId", as: "service" });

Services.hasMany(ServiceFees, { foreignKey: "serviceId", as: "fees" });
ServiceFees.belongsTo(Services, { foreignKey: "serviceId", as: "service" });

Services.hasMany(ServicePhases, { foreignKey: "serviceId", as: "phases" });
ServicePhases.belongsTo(Services, { foreignKey: "serviceId", as: "service" });

module.exports = {
  Clients,
  DSessions,
  Services,
  ServiceDocuments,
  ServiceFees,
  ServicePhases,
};
