// models/index.js
const Clients = require("./client");
const DSessions = require("./sessions");
const Services = require("./Service.js");
const ServiceDocuments = require("./ServiceDocuments.js");
const ServiceFees = require("./ServiceFees.js");
const ServicePhases = require("./ServicePhases.js");
const Submissions = require("./Submissions.js");
const SubmissionsStatus = require("./SubmissionsStatus.js");
const ServiceEnvisioning = require("./ServiceEnvisioning.js");
const ServiceFlows = require("./ServiceFlows.js");
const ServiceDesigns = require("./ServiceDesigns.js");
const ServiceScreensQA = require("./ServiceScreensQA.js");
const ServiceScreensDev = require("./ServiceScreensDev.js");
const Notifications = require("./Notifications.js");

Services.hasMany(ServiceDocuments, {
  foreignKey: "serviceId",
  sourceKey: "dguid",
  as: "documents",
});
ServiceDocuments.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
  targetKey: "dguid",
});

Services.hasMany(ServiceFees, {
  foreignKey: "serviceId",
  as: "fees",
  sourceKey: "dguid",
});
ServiceFees.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
  targetKey: "dguid",
});

Services.hasMany(ServicePhases, {
  foreignKey: "serviceId",
  as: "phases",
  sourceKey: "dguid",
});
ServicePhases.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
  targetKey: "dguid",
});

Services.hasMany(Submissions, {
  foreignKey: "serviceId",
  as: "submissions",
  sourceKey: "dguid",
});
Submissions.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
  targetKey: "dguid",
});

Submissions.hasMany(SubmissionsStatus, {
  foreignKey: "submissionId",
  as: "submissionsStatus",
  sourceKey: "dguid",
});
SubmissionsStatus.belongsTo(Submissions, {
  foreignKey: "submissionId",
  as: "submission",
  targetKey: "dguid",
});

Services.hasMany(ServiceEnvisioning, {
  foreignKey: "serviceId",
  sourceKey: "dguid",
  as: "serviceEnvisioning",
});
ServiceEnvisioning.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
  targetKey: "dguid",
});

Services.hasMany(ServiceFlows, {
  foreignKey: "serviceId",
  sourceKey: "dguid",
  as: "serviceFlows",
});
ServiceFlows.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
  targetKey: "dguid",
});

Services.hasMany(ServiceDesigns, {
  foreignKey: "serviceId",
  sourceKey: "dguid",
  as: "serviceDesigns",
});
ServiceDesigns.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
  targetKey: "dguid",
});

Services.hasMany(ServiceScreensDev, {
  foreignKey: "serviceId",
  sourceKey: "dguid",
  as: "serviceScreensDev",
});
ServiceScreensDev.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
  targetKey: "dguid",
});

Services.hasMany(ServiceScreensQA, {
  foreignKey: "serviceId",
  sourceKey: "dguid",
  as: "serviceScreensQA",
});
ServiceScreensQA.belongsTo(Services, {
  foreignKey: "serviceId",
  as: "service",
  targetKey: "dguid",
});

module.exports = {
  Clients,
  DSessions,
  Services,
  ServiceDocuments,
  ServiceFees,
  ServicePhases,
  Submissions,
  SubmissionsStatus,
  ServiceEnvisioning,
  ServiceFlows,
  ServiceDesigns,
  ServiceScreensDev,
  ServiceScreensQA,
  Notifications
};
