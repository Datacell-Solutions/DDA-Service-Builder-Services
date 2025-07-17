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
const { Op } = require("sequelize");

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
  TECHNICAL_APPROVED: "TECHNICAL APPROVED",
  TECHNICAL_REJECTED: "TECHNICAL REJECTED",
  BUSINESS_APPROVED: "BUSINESS APPROVED",
  BUSINESS_REJECTED: "BUSINESS REJECTED",
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
      BUSINESS_APPROVED: [],
      BUSINESS_REJECTED: [],
      TECHNICAL_APPROVED: [],
      TECHNICAL_REJECTED: [],
    },
    "entity technical": {
      DRAFT: ["develop.submit"],
      SUBMITTED: [],
      BUSINESS_APPROVED: [],
      BUSINESS_REJECTED: ["develop.submit"],
      TECHNICAL_APPROVED: [],
      TECHNICAL_REJECTED: ["develop.submit"],
    },
    "dda business": {
      DRAFT: [],
      SUBMITTED: ["develop.approve", "develop.reject"],
      BUSINESS_APPROVED: [],
      BUSINESS_REJECTED: [],
      TECHNICAL_APPROVED: [],
      TECHNICAL_REJECTED: [],
    },
    "dda technical": {
      DRAFT: [],
      SUBMITTED: [],
      BUSINESS_APPROVED: ["develop.approve", "develop.reject"],
      BUSINESS_REJECTED: [],
      TECHNICAL_APPROVED: [],
      TECHNICAL_REJECTED: [],
    },
  },
};

function getAllowedActions(userName, userType, userRole, phase, currentStatus) {
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
  const userName = req.user.userName;
  const entityId = req.entity.guid;
  const userRole = req.user.role;
  const userType = req.user.type;
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
        userName,
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
            amount: fee.amount,
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

    const actions = getAllowedActions(
      userName,
      userType,
      userRole,
      process.env.DEFINE_PHASE_KEY,
      SubmissionStatus.DRAFT
    );
    await t.commit();
    return res.json(
      successResponse({
        serviceId: newService.dguid,
        actions,
      })
    );
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const updateService = async (req, res) => {
  const userName = req.user.userName;
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
        updatedBy: userName,
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
  const userRole = req.user.role;
  const userType = req.user.type;
  const userName = req.user.userName;

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

    const actions = getAllowedActions(
      userName,
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
  const userRole = req.user.role;
  const userType = req.user.type;
  const userName = req.user.userName;
  const entity = req.entity;
  const entities = req.entities;

  try {
    const whereClause = {};

    // Filter by entity/entities
    if (userType === "entity") {
      whereClause.entityId = entity.guid;
    } else if (userType === "dda") {
      const entityIds = entities.map((e) => e.guid);
      whereClause.entityId = { [Op.in]: entityIds };
    }

    const services = await Services.findAll({
      where: whereClause,
      attributes: ["id", "dguid", "nameEn", "nameAr"],
      include: [
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
    });

    // Step 2: Filter and get latest submission + status
    const filteredServices = services.filter((service) => {
      const sortedSubmissions = [...(service.submissions || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const latestSubmission = sortedSubmissions[0];

      const sortedStatuses = [
        ...(latestSubmission?.submissionsStatus || []),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const latestStatus = sortedStatuses[0]?.status;

      if (userRole === "technical") {
        return latestStatus === "develop";
      }
      return true;
    });

    // Step 3: Transform result
    const transformedServices = filteredServices.map((service) => {
      const sortedSubmissions = [...(service.submissions || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const latestSubmission = sortedSubmissions[0];

      const sortedStatuses = [
        ...(latestSubmission?.submissionsStatus || []),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const currentStatus = sortedStatuses[0]?.status || null;

      const submissionJson = latestSubmission
        ? latestSubmission.toJSON()
        : null;
      if (submissionJson) delete submissionJson.submissionsStatus;

      const actions = getAllowedActions(
        userName,
        userType,
        userRole,
        submissionJson?.phaseKey,
        currentStatus
      );

      return {
        ...service.toJSON(),
        submissions: latestSubmission
          ? [
              {
                ...submissionJson,
                currentStatus,
              },
            ]
          : [],
        actions,
      };
    });

    return res.json(successResponse(transformedServices));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const submitUserAction = async (req, res) => {
  const userName = req.user.userName;
  const userRole = req.user.role;
  const userType = req.user.type;
  const { serviceId, action, comment } = req.body;
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
      userName,
      userType,
      userRole,
      lastSubmission.phaseKey,
      lastSubmission.currentStatus
    );

    console.log("userType:", userType);
    console.log("userRole:", userRole);
    console.log("Last Submission:", lastSubmission);
    console.log("Actions:", actions);

    if (!actions.includes(action)) {
      return res.json(
        errorResponse("You are not authorized to perform this action", 403)
      );
    }

    if (action.includes("submit")) {
      return await submitPhase(
        res,
        lastSubmission.dguid,
        lastSubmission.currentStatus,
        comment
      );
    }
    if (action.includes("approve")) {
      return await approvePhase(
        req,
        res,
        lastSubmission.dguid,
        lastSubmission.currentStatus,
        action,
        comment
      );
    }
    if (action.includes("reject")) {
      return await rejectPhase(
        req,
        res,
        lastSubmission.dguid,
        lastSubmission.currentStatus,
        action,
        comment
      );
    }
    return res.json(errorResponse("Invalid action", 400));
  } catch (error) {
    console.error("approveStep error:", error);
    return res.status(500).json(errorResponse("Internal server error", 500));
  }
};

const submitPhase = async (res, submissionId, currentStatus, comment) => {
  if (
    currentStatus !== SubmissionStatus.DRAFT ||
    currentStatus !== SubmissionStatus.REJECTED ||
    currentStatus !== SubmissionStatus.BUSINESS_REJECTED ||
    currentStatus !== SubmissionStatus.TECHNICAL_REJECTED
  ) {
    return res.json(
      errorResponse(
        "Submission can't be SUBMITTED",
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
  req,
  res,
  submissionId,
  currentStatus,
  action,
  comment
) => {
  const userRole = req.user.role;
  const userType = req.user.type;

  const t = await Services.sequelize.transaction();
  try {
    if (action === "develop.approve") {
      if (userType !== "dda") {
        return res.json(
          errorResponse("Only DDA can approve in this phase", 403)
        );
      } else {
        if (userRole !== "business") {
          if (currentStatus !== SubmissionStatus.SUBMITTED) {
            return res.json(
              errorResponse(
                "Submission must be in Submit status before it can be APPROVED",
                400
              )
            );
          }

          await SubmissionsStatus.create(
            {
              submissionId,
              status: SubmissionStatus.BUSINESS_APPROVED,
              comment: comment,
            },
            { transaction: t }
          );
        }

        if (userRole !== "technical") {
          if (currentStatus !== SubmissionStatus.BUSINESS_APPROVED) {
            return res.json(
              errorResponse(
                "Submission must be in Approve status before it can be APPROVED from Business",
                400
              )
            );
          }

          await SubmissionsStatus.create(
            {
              submissionId,
              status: SubmissionStatus.TECHNICAL_APPROVED,
              comment: comment,
            },
            { transaction: t }
          );
        }
      }
    } else {
      if (currentStatus !== SubmissionStatus.SUBMITTED) {
        return res.json(
          errorResponse(
            "Submission must be in SUBMIT status before it can be APPROVED",
            400
          )
        );
      }

      await SubmissionsStatus.create(
        {
          submissionId,
          status: SubmissionStatus.APPROVED,
          comment: comment,
        },
        { transaction: t }
      );
    }

    await t.commit();
    return res.json(successResponse(true));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const rejectPhase = async (
  req,
  res,
  submissionId,
  currentStatus,
  action,
  comment
) => {
  const userRole = req.user.role;
  const userType = req.user.type;

  const t = await Services.sequelize.transaction();
  try {
    if (action === "develop.reject") {
      if (userType !== "dda") {
        return res.json(
          errorResponse("Only DDA can approve in this phase", 403)
        );
      } else {
        if (userRole !== "business") {
          if (currentStatus !== SubmissionStatus.SUBMITTED) {
            return res.json(
              errorResponse(
                "Submission must be in Submit status before it can be REJECTED",
                400
              )
            );
          }

          await SubmissionsStatus.create(
            {
              submissionId,
              status: SubmissionStatus.BUSINESS_REJECTED,
              comment: comment,
            },
            { transaction: t }
          );
        }

        if (userRole !== "technical") {
          if (currentStatus !== SubmissionStatus.BUSINESS_APPROVED) {
            return res.json(
              errorResponse(
                "Submission must be in Reject status before it can be APPROVED from Business",
                400
              )
            );
          }

          await SubmissionsStatus.create(
            {
              submissionId,
              status: SubmissionStatus.TECHNICAL_REJECTED,
              comment: comment,
            },
            { transaction: t }
          );
        }
      }
    } else {
      if (currentStatus !== SubmissionStatus.SUBMITTED) {
        return res.json(
          errorResponse(
            "Submission must be in SUBMIT status before it can be REJECTED",
            400
          )
        );
      }

      await SubmissionsStatus.create(
        {
          submissionId,
          status: SubmissionStatus.REJECTED,
          comment: comment,
        },
        { transaction: t }
      );
    }
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
