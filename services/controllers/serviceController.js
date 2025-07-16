const {
  Services,
  ServiceDocuments,
  ServiceFees,
  Submissions,
  SubmissionsStatus,
} = require("../models");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHandler");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

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

const SubmissionStatus = Object.freeze({
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});

const actionsMatrix = {
  [process.env.DEFINE_PHASE_KEY]: {
    "entity business": {
      DRAFT: ["define.submit"],
      SUBMITTED: [],
      APPROVED: ["envisioning.draft"],
      REJECTED: ["define.submit"],
    },
    "entity technical": {
      DRAFT: [],
      SUBMITTED: [],
      APPROVED: [],
      REJECTED: [],
    },
    "dda business": {
      DRAFT: [],
      SUBMITTED: ["define.approve", "define.reject"],
      APPROVED: [],
      REJECTED: [],
    },
    "dda technical": {
      DRAFT: [],
      SUBMITTED: [],
      APPROVED: [],
      REJECTED: [],
    },
  },

  [process.env.ENVISIONING_PHASE_KEY]: {
    "entity business": {
      DRAFT: ["envisioning.submit"],
      SUBMITTED: [],
      APPROVED: ["design.draft"],
      REJECTED: ["envisioning.submit"],
    },
    "entity technical": {
      DRAFT: [],
      SUBMITTED: [],
      APPROVED: [],
      REJECTED: [],
    },
    "dda business": {
      DRAFT: [],
      SUBMITTED: ["envisioning.approve", "envisioning.reject"],
      APPROVED: [],
      REJECTED: [],
    },
    "dda technical": {
      DRAFT: [],
      SUBMITTED: [],
      APPROVED: [],
      REJECTED: [],
    },
  },

  [process.env.DESIGN_PHASE_KEY]: {
    "entity business": {
      DRAFT: ["design.submit"],
      SUBMITTED: [],
      APPROVED: ["develop.draft"],
      REJECTED: ["design.submit"],
    },
    "entity technical": {
      DRAFT: [],
      SUBMITTED: [],
      APPROVED: [],
      REJECTED: [],
    },
    "dda business": {
      DRAFT: [],
      SUBMITTED: ["design.approve", "design.reject"],
      APPROVED: [],
      REJECTED: [],
    },
    "dda technical": {
      DRAFT: [],
      SUBMITTED: [],
      APPROVED: [],
      REJECTED: [],
    },
  },

  [process.env.DEVELOPMENT_PHASE_KEY]: {
    "entity business": {
      DRAFT: [],
      SUBMITTED: [],
      "BUSINESS APPROVED": [],
      "BUSINESS REJECTED": [],
      "TECHNICAL APPROVED": [],
      "TECHNICAL REJECTED": [],
    },
    "entity technical": {
      DRAFT: ["develop.submit"],
      SUBMITTED: [],
      "BUSINESS APPROVED": [],
      "BUSINESS REJECTED": ["develop.submit"],
      "TECHNICAL APPROVED": [],
      "TECHNICAL REJECTED": ["develop.submit"],
    },
    "dda business": {
      DRAFT: [],
      SUBMITTED: ["develop.approve", "develop.reject"],
      "BUSINESS APPROVED": [],
      "BUSINESS REJECTED": [],
      "TECHNICAL APPROVED": [],
      "TECHNICAL REJECTED": [],
    },
    "dda technical": {
      DRAFT: [],
      SUBMITTED: [],
      "BUSINESS APPROVED": ["develop.approve", "develop.reject"],
      "BUSINESS REJECTED": [],
      "TECHNICAL APPROVED": [],
      "TECHNICAL REJECTED": [],
    },
  },
};

function getAllowedActions(userType, userRole, phase, currentStatus) {
  const fullRole = `${userType} ${userRole}`;
  const phaseData = actionsMatrix[phase];
  if (!phaseData) return [];

  const roleData = phaseData[fullRole];
  if (!roleData) return [];

  return roleData[currentStatus] || [];
}

//Add createdBy and updatedBy fields
//check service owner
const addService = async (req, res) => {
  //Change this to read from the token
  const entityId = uuidv4();
  const {
    nameEn,
    nameAr,
    serviceCode,
    DepartmentEn,
    DepartmentAr,
    SectorEn,
    SectorAr,
    DescriptionEn,
    DescriptionAr,
    ServiceFees: serviceFeeValue,
    ServiceChannelApply,
    ServiceChannelDeliver,
    ServiceChannelPay,
    documents,
    fees,
  } = req.body;

  const t = await Services.sequelize.transaction();
  try {
    const newService = await Services.create(
      {
        entityId: entityId,
        nameEn,
        nameAr,
        serviceCode,
        DepartmentEn,
        DepartmentAr,
        SectorEn,
        SectorAr,
        DescriptionEn,
        DescriptionAr,
        ServiceFees: serviceFeeValue,
        ServiceChannelApply,
        ServiceChannelDeliver,
        ServiceChannelPay,
      },
      { transaction: t }
    );

    const serviceId = newService.dguid;

    if (Array.isArray(documents)) {
      for (const doc of documents) {
        await ServiceDocuments.create(
          {
            serviceId,
            documentNameEn: doc.documentNameEn,
            documentNameAr: doc.documentNameAr,
          },
          { transaction: t }
        );
      }
    }

    if (Array.isArray(fees)) {
      for (const fee of fees) {
        await ServiceFees.create(
          {
            serviceId,
            titleEn: fee.titleEn,
            titleAr: fee.titleAr,
            descriptionEn: fee.descriptionEn,
            descriptionAr: fee.descriptionAr,
          },
          { transaction: t }
        );
      }
    }

    const newSubmission = await Submissions.create(
      {
        serviceId: serviceId,
        phaseKey: process.env.DEFINE_PHASE_KEY,
      },
      { transaction: t }
    );

    await SubmissionsStatus.create(
      {
        submissionId: newSubmission.dguid,
        status: SubmissionStatus.DRAFT,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json(successResponse(newService.dguid));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const updateService = async (req, res) => {
  const { serviceId } = req.params;
  const {
    submissionId,
    nameEn,
    nameAr,
    serviceCode,
    DepartmentEn,
    DepartmentAr,
    SectorEn,
    SectorAr,
    DescriptionEn,
    DescriptionAr,
    ServiceFees: serviceFeeValue,
    ServiceChannelApply,
    ServiceChannelDeliver,
    ServiceChannelPay,
    documents,
    fees,
  } = req.body;

  const t = await Services.sequelize.transaction();
  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: { include: ["id"] },
    });
    if (!service) {
      await t.rollback();
      return res.json(errorResponse("Service not found", 404));
    }

    await service.update(
      {
        nameEn,
        nameAr,
        serviceCode,
        DepartmentEn,
        DepartmentAr,
        SectorEn,
        SectorAr,
        DescriptionEn,
        DescriptionAr,
        ServiceFees: serviceFeeValue,
        ServiceChannelApply,
        ServiceChannelDeliver,
        ServiceChannelPay,
        updatedAt: new Date(),
      },
      { transaction: t }
    );

    if (Array.isArray(documents)) {
      await ServiceDocuments.destroy({
        where: { serviceId: service.dguid },
        transaction: t,
      });

      for (const doc of documents) {
        await ServiceDocuments.create(
          {
            serviceId: service.dguid,
            documentNameEn: doc.documentNameEn,
            documentNameAr: doc.documentNameAr,
          },
          { transaction: t }
        );
      }
    }

    if (Array.isArray(fees)) {
      await ServiceFees.destroy({
        where: { serviceId: service.dguid },
        transaction: t,
      });

      for (const fee of fees) {
        await ServiceFees.create(
          {
            serviceId: service.dguid,
            titleEn: fee.titleEn,
            titleAr: fee.titleAr,
            descriptionEn: fee.descriptionEn,
            descriptionAr: fee.descriptionAr,
          },
          { transaction: t }
        );
      }
    }

    const submission = await Submissions.findOne({
      attributes: { include: ["id"] },
      where: { dguid: submissionId },
    });
    await SubmissionsStatus.create(
      {
        submissionId: submission.dguid,
        status: SubmissionStatus.DRAFT,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json(successResponse(true));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const getService = async (req, res) => {
  const { serviceId } = req.params;
  const userRole = req.headers["userrole"];
  const userType = req.headers["usertype"];
  console.log("headers:", req.headers);
  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      include: [
        {
          model: ServiceDocuments,
          as: "documents",
          required: true,
        },
        {
          model: ServiceFees,
          as: "fees",
          required: true,
        },
        {
          model: Submissions,
          as: "submissions",
          required: true,
          include: [
            {
              model: SubmissionsStatus,
              as: "submissionsStatus",
              attributes: ["dguid", "status", "comment", "createdAt"],
            },
          ],
        },
      ],
      order: [
        [
          { model: Submissions, as: "submissions" },
          { model: SubmissionsStatus, as: "submissionsStatus" },
          "createdAt",
          "DESC",
        ],
      ],
    });

    if (!service) {
      return res.json(errorResponse("Service not found", 404));
    }
    const transformedSubmissions = service.submissions.map((submission) => {
      const statuses = submission.submissionsStatus || [];
      const currentStatus = statuses.length > 0 ? statuses[0].status : null;

      return {
        ...submission.toJSON(),
        currentStatus,
      };
    });

    const currentSubmission = transformedSubmissions[0];

    console.log("Current Submission:", {
      userType,
      userRole,
      phaseKey: currentSubmission.phaseKey,
      currentStatus: currentSubmission.currentStatus,
    });

    const actions = getAllowedActions(
      userType,
      userRole,
      currentSubmission.phaseKey,
      currentSubmission.currentStatus
    );

    const result = {
      ...service.toJSON(),
      submissions: transformedSubmissions,
      actions,
    };

    return res.json(successResponse(result));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const getAllServices = async (req, res) => {
  const userRole = req.headers["userrole"];
  const userType = req.headers["usertype"];
  try {
    const services = await Services.findAll({
      attributes: { include: ["id"] },
      include: [
        {
          model: ServiceDocuments,
          as: "documents",
          required: true,
        },
        {
          model: ServiceFees,
          as: "fees",
          required: true,
        },
        {
          model: Submissions,
          as: "submissions",
          required: true,
          include: [
            {
              model: SubmissionsStatus,
              as: "submissionsStatus",
              attributes: ["dguid", "status", "comment", "createdAt"],
            },
          ],
        },
      ],
      order: [
        [
          { model: Submissions, as: "submissions" },
          { model: SubmissionsStatus, as: "submissionsStatus" },
          "createdAt",
          "DESC",
        ],
      ],
    });

    const transformedServices = services.map((service) => {
      const submissions =
        service.submissions?.map((submission) => {
          const submissionJson = submission.toJSON();
          const statuses = submissionJson.submissionsStatus || [];
          const currentStatus = statuses.length > 0 ? statuses[0].status : null;

          delete submissionJson.submissionsStatus;

          return {
            ...submissionJson,
            currentStatus,
          };
        }) || [];

      const currentSubmission = submissions[0];
      const actions = getAllowedActions(
        userType,
        userRole,
        currentSubmission.phaseKey,
        currentSubmission.currentStatus
      );

      return {
        ...service.toJSON(),
        submissions,
        actions,
      };
    });

    return res.json(successResponse(transformedServices));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const getSubmissionDetails = async (req, res) => {
  const { submissionId } = req.params;
  try {
    const submission = await Submissions.findOne({
      where: { dguid: submissionId },
      include: [
        {
          model: Services,
          as: "service",
        },
        {
          model: SubmissionsStatus,
          as: "submissionsStatus",
          attributes: ["dguid", "status", "comment", "createdAt"],
        },
      ],
      order: [
        [
          { model: SubmissionsStatus, as: "submissionsStatus" },
          "createdAt",
          "DESC",
        ],
      ],
    });

    if (!submission) {
      return res.json(errorResponse("Submission not found", 404));
    }

    const statusHistory = submission.submissionsStatus || [];
    const currentStatus = statusHistory[0] || null;

    return res.json({
      id: submission.dguid,
      dguid: submission.dguid,
      service: submission.service,
      currentStatus: currentStatus.status,
      submissionsStatus: statusHistory,
    });
  } catch (err) {
    console.error(err);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const submitUserAction = async (req, res) => {
  const { serviceId, action, comment, userRole, userType } = req.body;
  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      include: [
        {
          model: ServiceDocuments,
          as: "documents",
          required: true,
        },
        {
          model: ServiceFees,
          as: "fees",
          required: true,
        },
        {
          model: Submissions,
          as: "submissions",
          required: true,
          include: [
            {
              model: SubmissionsStatus,
              as: "submissionsStatus",
              attributes: ["dguid", "status", "comment", "createdAt"],
            },
          ],
        },
      ],
      order: [
        [
          { model: Submissions, as: "submissions" },
          { model: SubmissionsStatus, as: "submissionsStatus" },
          "createdAt",
          "DESC",
        ],
      ],
    });

    if (!service) {
      return res.json(errorResponse("Service not found", 404));
    }

    const transformedSubmissions = service.submissions.map((submission) => {
      const submissionJson = submission.toJSON();
      const statuses = submissionJson.submissionsStatus || [];
      const currentStatus = statuses.length > 0 ? statuses[0].status : null;

      // Remove submissionsStatus
      delete submissionJson.submissionsStatus;

      return {
        ...submissionJson,
        currentStatus,
      };
    });

    const newService = {
      ...service.toJSON(),
      submissions: transformedSubmissions,
    };

    const lastSubmission = newService.submissions[0];
    if (!lastSubmission) {
      return res.json(
        errorResponse("No submissions found for this service", 404)
      );
    }

    const actions = getAllowedActions(
      userType,
      userRole,
      lastSubmission.phaseKey,
      lastSubmission.currentStatus
    );

    if (!actions.includes(action)) {
      return res.json(
        errorResponse("You are not authorized to perform this action", 403)
      );
    }

    switch (action) {
      case "define.submit":
        return await submitPhase(
          res,
          lastSubmission.dguid,
          lastSubmission.currentStatus,
          comment
        );
      case "define.approve":
        return await approvePhase(
          res,
          lastSubmission.dguid,
          lastSubmission.currentStatus,
          action,
          comment
        );
      case "define.reject":
        return await rejectPhase(
          res,
          lastSubmission.dguid,
          lastSubmission.currentStatus,
          action,
          comment
        );
        
      default:
        return res.json(errorResponse("Invalid action", 400));
    }
  } catch (error) {
    console.error("approveStep error:", error);
    return res.status(500).json(errorResponse("Internal server error", 500));
  }
};

const submitPhase = async (res, submissionId, currentStatus, comment) => {
  if (currentStatus !== SubmissionStatus.DRAFT) {
    return res.json(
      errorResponse(
        "Submission must be in DRAFT status before it can be SUBMITTED",
        400
      )
    );
  }

  const t = await Services.sequelize.transaction();
  try {
    await SubmissionsStatus.create(
      {
        submissionId,
        status: SubmissionStatus.SUBMITTED,
        comment: comment,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json(successResponse(true));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const approvePhase = async (
  res,
  submissionId,
  currentStatus,
  action,
  comment
) => {
  if (currentStatus !== SubmissionStatus.SUBMITTED) {
    return res.json(
      errorResponse(
        "Submission must be in SUBMIT status before it can be APPROVED",
        400
      )
    );
  }

  const t = await Services.sequelize.transaction();
  try {
    await SubmissionsStatus.create(
      {
        submissionId,
        status: "APPROVED",
        comment: comment,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json(successResponse(true));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const rejectPhase = async (
  res,
  submissionId,
  currentStatus,
  action,
  comment
) => {
  if (currentStatus !== SubmissionStatus.SUBMITTED) {
    return res.json(
      errorResponse(
        "Submission must be in SUBMIT status before it can be REJECTED",
        400
      )
    );
  }

  const t = await Services.sequelize.transaction();
  try {
    await SubmissionsStatus.create(
      {
        submissionId,
        status: "REJECTED",
        comment: comment,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json(successResponse(true));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const addTestCases = async (req, res) => {
  const { serviceId } = req.body;

  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: { include: ["id"] },
    });
    if (!service) {
      await t.rollback();
      return res.json(errorResponse("Service not found", 404));
    }

    if (!req.file) {
      return res.status(400).json({ code: 400, message: "No file uploaded" });
    }

    const oldPath = req.file.path;

    const extension = path.extname(req.file.originalname);
    const newFilename = `${service.nameEn} Test Cases${extension}`;
    const newPath = path.join(path.dirname(oldPath), newFilename);

    fs.renameSync(oldPath, newPath);

    const filePath = `/${folder}/${newFilename}`;

    res.status(200).json({
      code: 201,
      data: filePath,
      message: "Success",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ code: 500, message: "Internal server error" });
  }
};

module.exports = {
  addService,
  updateService,
  getService,
  getAllServices,
  submitUserAction,
  getSubmissionDetails,
  addTestCases,
  upload,
};
