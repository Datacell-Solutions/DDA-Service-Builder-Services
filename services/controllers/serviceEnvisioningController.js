const {
  Services,
  Submissions,
  SubmissionsStatus,
  ServiceEnvisioning,
  ServiceFlows,
} = require("../models");
const { errorResponse } = require("../../utils/responseHandler");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const {
  SubmissionStatus,
  getAllowedActions,
} = require("../../utils/actionMatrixHandler");

const folder = "attachments";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../..", folder);
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const upload = multer({ storage: storage });

const authorizeEntityUserToSubmit = (req, res, next) => {
  const user = req.user;
  if (!(user?.type === "entity" && user?.role === "business")) {
    return res.json(
      errorResponse("You are not authorized to perform this action", 403)
    );
  }
  next();
};

const addEnvisioning = async (req, res) => {
  const { serviceId, flows } = req.body;
  const userName = req.user.userName;
  const userRole = req.user.role;
  const userType = req.user.type;
  const t = await Services.sequelize.transaction();
  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: { include: ["id"] },
    });
    if (!service) {
      return res.json(errorResponse("Service not found", 404));
    }

    const testCaseFile = req.files?.TestCase?.[0] || null;
    const brdFile = req.files?.BRD?.[0] || null;
    const apisDocumentationFile = req.files?.APIsDocumentation?.[0] || null;
    const apisCollectionFile = req.files?.APIsCollection?.[0] || null;

    let testCaseFileName = "";
    let brdFileName = "";
    let apisDocumentationFileName = "";
    let apisCollectionFileName = "";

    if (testCaseFile !== null) {
      const oldPath = testCaseFile.path;
      const extension = path.extname(testCaseFile.originalname);
      const newFilename = `${service.nameEn
        .replace(/\s+/g, "-")
        .toLowerCase()}-test-cases${extension}`;
      const newPath = path.join(path.dirname(oldPath), newFilename);
      fs.renameSync(oldPath, newPath);
      testCaseFileName = `/${folder}/${newFilename}`;
    }
    if (brdFile !== null) {
      const oldPath = brdFile.path;
      const extension = path.extname(brdFile.originalname);
      const newFilename = `${service.nameEn
        .replace(/\s+/g, "-")
        .toLowerCase()}-brd${extension}`;
      const newPath = path.join(path.dirname(oldPath), newFilename);
      fs.renameSync(oldPath, newPath);
      brdFileName = `/${folder}/${newFilename}`;
    }
    if (apisDocumentationFile !== null) {
      const oldPath = apisDocumentationFile.path;
      const extension = path.extname(apisDocumentationFile.originalname);
      const newFilename = `${service.nameEn
        .replace(/\s+/g, "-")
        .toLowerCase()}-apis-documentation${extension}`;
      const newPath = path.join(path.dirname(oldPath), newFilename);
      fs.renameSync(oldPath, newPath);
      apisDocumentationFileName = `/${folder}/${newFilename}`;
    }
    if (apisCollectionFile !== null) {
      const oldPath = apisCollectionFile.path;
      const extension = path.extname(apisCollectionFile.originalname);
      const newFilename = `${service.nameEn
        .replace(/\s+/g, "-")
        .toLowerCase()}-apis-collection${extension}`;
      const newPath = path.join(path.dirname(oldPath), newFilename);
      fs.renameSync(oldPath, newPath);
      apisCollectionFileName = `/${folder}/${newFilename}`;
    }

    if (flows) {
      let parsedFlows = flows;

      if (typeof flows === "string") {
        try {
          parsedFlows = JSON.parse(flows);
        } catch (err) {
          return res.json(errorResponse("Invalid JSON in flows", 400));
        }
      }

      await Promise.all(
        parsedFlows.map((flow) => {
          const { title, json } = flow;

          return ServiceFlows.create({
            serviceId,
            title,
            json: typeof json === "object" ? JSON.stringify(json) : json,
            createdBy: req.user.userName,
          });
        })
      );
    }

    await ServiceEnvisioning.create(
      {
        serviceId: serviceId,
        testCase: testCaseFileName,
        brd: brdFileName,
        apisDocumentation: apisDocumentationFileName,
        apisCollection: apisCollectionFileName,
        createdBy: req.user.userName,
      },
      { transaction: t }
    );

    let submission = await Submissions.findOne({
      where: { phaseKey: process.env.ENVISIONING_PHASE_KEY },
    });

    if (!submission) {
      submission = await Submissions.create(
        {
          serviceId: serviceId,
          phaseKey: process.env.ENVISIONING_PHASE_KEY,
          createdBy: req.user.userName,
        },
        { transaction: t }
      );
    }
    const newSubmissionStatus = await SubmissionsStatus.create(
      {
        submissionId: submission.dguid,
        status: SubmissionStatus.DRAFT,
        createdBy: req.user.userName,
      },
      { transaction: t }
    );

    const actions = getAllowedActions(
      userName,
      userType,
      userRole,
      submission.phaseKey,
      newSubmissionStatus.status
    );
    await t.commit();

    res.status(200).json({
      code: 201,
      data: {
        testCaseFileName,
        brdFileName,
        apisDocumentationFileName,
        apisCollectionFileName,
        actions,
      },
      message: "Success",
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res
      .status(500)
      .json({ code: 500, message: "Internal server error" });
  }
};

const updateEnvisioning = async (req, res) => {
  const { serviceId, flows } = req.body;
  const userName = req.user.userName;
  const userRole = req.user.role;
  const userType = req.user.type;
  const t = await Services.sequelize.transaction();

  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: { include: ["id", "nameEn"] },
    });

    if (!service) {
      return res.json(errorResponse("Service not found", 404));
    }

    const testCaseFile = req.files?.TestCase?.[0] || null;
    const brdFile = req.files?.BRD?.[0] || null;
    const apisDocumentationFile = req.files?.APIsDocumentation?.[0] || null;
    const apisCollectionFile = req.files?.APIsCollection?.[0] || null;

    const renameFile = (file, suffix) => {
      const oldPath = file.path;
      const extension = path.extname(file.originalname);
      const newFilename = `${service.nameEn
        .replace(/\s+/g, "-")
        .toLowerCase()}-${suffix}${extension}`;
      const newPath = path.join(path.dirname(oldPath), newFilename);
      fs.renameSync(oldPath, newPath);
      return `/${folder}/${newFilename}`;
    };

    const testCaseFileName = testCaseFile
      ? renameFile(testCaseFile, "test-cases")
      : undefined;
    const brdFileName = brdFile ? renameFile(brdFile, "brd") : undefined;
    const apisDocumentationFileName = apisDocumentationFile
      ? renameFile(apisDocumentationFile, "apis-documentation")
      : undefined;
    const apisCollectionFileName = apisCollectionFile
      ? renameFile(apisCollectionFile, "apis-collection")
      : undefined;

    if (flows) {
      let parsedFlows = flows;

      if (typeof flows === "string") {
        try {
          parsedFlows = JSON.parse(flows);
        } catch (err) {
          return res.json(errorResponse("Invalid JSON in flows", 400));
        }
      }

      await ServiceFlows.destroy({ where: { serviceId } });

      await Promise.all(
        parsedFlows.map((flow) => {
          const { title, json } = flow;

          return ServiceFlows.create({
            serviceId,
            title,
            json: typeof json === "object" ? JSON.stringify(json) : json,
            createdBy: userName,
          });
        })
      );
    }

    const existing = await ServiceEnvisioning.findOne({
      where: { serviceId },
      attributes: { include: ["id"] },
    });

    if (existing) {
      await existing.update(
        {
          ...(testCaseFileName && { testCase: testCaseFileName }),
          ...(brdFileName && { brd: brdFileName }),
          ...(apisDocumentationFileName && {
            apisDocumentation: apisDocumentationFileName,
          }),
          ...(apisCollectionFileName && {
            apisCollection: apisCollectionFileName,
          }),
          updatedBy: userName,
          updatedAt: new Date(),
        },
        { transaction: t }
      );
    } else {
      await ServiceEnvisioning.create(
        {
          serviceId,
          testCase: testCaseFileName || "",
          brd: brdFileName || "",
          apisDocumentation: apisDocumentationFileName || "",
          apisCollection: apisCollectionFileName || "",
          createdBy: userName,
        },
        { transaction: t }
      );
    }

    let submission = await Submissions.findOne({
      where: { serviceId, phaseKey: process.env.ENVISIONING_PHASE_KEY },
    });

    if (!submission) {
      submission = await Submissions.create(
        {
          serviceId,
          phaseKey: process.env.ENVISIONING_PHASE_KEY,
          createdBy: userName,
        },
        { transaction: t }
      );
    }

    const newSubmissionStatus = await SubmissionsStatus.create(
      {
        submissionId: submission.dguid,
        status: SubmissionStatus.DRAFT,
        createdBy: userName,
      },
      { transaction: t }
    );

    const actions = getAllowedActions(
      userName,
      userType,
      userRole,
      submission.phaseKey,
      newSubmissionStatus.status
    );

    await t.commit();

    return res.status(200).json({
      code: 200,
      data: {
        testCaseFileName,
        brdFileName,
        apisDocumentationFileName,
        apisCollectionFileName,
        actions,
      },
      message: "Updated successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res
      .status(500)
      .json({ code: 500, message: "Internal server error" });
  }
};

const getEnvisioning = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: ["id", "nameEn"],
    });

    if (!service) {
      return res.status(404).json(errorResponse("Service not found", 404));
    }

    const envisioning = await ServiceEnvisioning.findOne({
      where: { serviceId },
      attributes: [
        "testCase",
        "brd",
        "apisDocumentation",
        "apisCollection",
      ],
    });

    const flows = await ServiceFlows.findAll({
      where: { serviceId },
      attributes: ["title", "json", "createdBy", "createdAt"],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      code: 200,
      data: {
        envisioning: envisioning || {},
        flows: flows.map((flow) => ({
          title: flow.title,
          json: typeof flow.json === "string" ? JSON.parse(flow.json) : flow.json,
          createdBy: flow.createdBy,
          createdAt: flow.createdAt,
        })),
      },
      message: "Fetched successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: "Internal server error" });
  }
};

module.exports = {
  authorizeEntityUserToSubmit,
  addEnvisioning,
  updateEnvisioning,
  getEnvisioning,
  upload,
};
