const express = require("express");
const router = express.Router();

const ServiceEnvisioning = require("./controllers/serviceEnvisioningController");
const Service = require("./controllers/serviceController");

// Template Routes
router.post("/add", Service.addService);
router.post("/update/:serviceId", Service.updateService);
router.get("/getAll", Service.getAllServices);
router.get("/get/:serviceId", Service.getService);
router.post("/submitUserAction", Service.submitUserAction);
router.get("/getSubmissionDetails/:submissionId", Service.getSubmissionDetails);
router.post(
  "/addEnvisioning",
  ServiceEnvisioning.authorizeEntityUserToSubmit,
  ServiceEnvisioning.upload.fields([
    { name: "TestCase", maxCount: 1 },
    { name: "BRD", maxCount: 1 },
    { name: "APIsDocumentation", maxCount: 1 },
    { name: "APIsCollection", maxCount: 1 },
  ]),
  ServiceEnvisioning.addEnvisioning
);
router.post(
  "/updateEnvisioning",
  ServiceEnvisioning.authorizeEntityUserToSubmit,
  ServiceEnvisioning.upload.fields([
    { name: "TestCase", maxCount: 1 },
    { name: "BRD", maxCount: 1 },
    { name: "APIsDocumentation", maxCount: 1 },
    { name: "APIsCollection", maxCount: 1 },
  ]),
  ServiceEnvisioning.updateEnvisioning
);
router.get("/getEnvisioning/:serviceId", ServiceEnvisioning.getEnvisioning);

router.get("/getEntities", Service.getEntities);
router.get("/getPhase", Service.getPhase);
module.exports = router;
