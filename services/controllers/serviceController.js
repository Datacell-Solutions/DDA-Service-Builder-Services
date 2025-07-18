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
const { Op } = require("sequelize");
const {
  SubmissionStatus,
  getAllowedActions,
} = require("../../utils/actionMatrixHandler");

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
        createdBy: req.user.userName,
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
            createdBy: req.user.userName,
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
            createdBy: req.user.userName,
          },
          { transaction: t }
        );
      }
    }

    const newSubmission = await Submissions.create(
      {
        serviceId: serviceId,
        phaseKey: process.env.DEFINE_PHASE_KEY,
        createdBy: req.user.userName,
      },
      { transaction: t }
    );

    await SubmissionsStatus.create(
      {
        submissionId: newSubmission.dguid,
        status: SubmissionStatus.DRAFT,
        createdBy: req.user.userName,
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
    await t.rollback();
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
      console.log({ documents });
      for (const doc of documents) {
        await ServiceDocuments.create(
          {
            serviceId: service.dguid,
            documentNameEn: doc.documentNameEn,
            documentNameAr: doc.documentNameAr,
            createdBy: req.user.userName,
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
            amount: fee.amount,
            createdBy: req.user.userName,
          },
          { transaction: t }
        );
      }
    }

    // const submission = await Submissions.findOne({
    //   attributes: { include: ["id"] },
    //   where: { dguid: submissionId },
    // });
    // await SubmissionsStatus.create(
    //   {
    //     submissionId: submission.dguid,
    //     status: SubmissionStatus.DRAFT,
    //     createdBy: req.user.userName,
    //   },
    //   { transaction: t }
    // );

    await t.commit();
    return res.json(successResponse(true));
  } catch (error) {
    await t.rollback();
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
          required: false,
        },
        {
          model: ServiceFees,
          as: "fees",
          required: false,
        },
      ],
    });

    if (!service) {
      return res.json(errorResponse("Service not found", 404));
    }

    const submissions = await Submissions.findAll({
      where: { serviceId: service.dguid },
      include: [
        {
          model: SubmissionsStatus,
          as: "submissionsStatus",
          required: false,
          attributes: ["dguid", "status", "comment", "createdAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const transformedSubmissions = submissions.map((submission) => {
      const subJson = submission.toJSON();

      const sortedStatuses = (subJson.submissionsStatus || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      const currentStatus = sortedStatuses[0]?.status || null;

      subJson.submissionsStatus = sortedStatuses;

      return {
        ...subJson,
        currentStatus,
      };
    });

    const currentSubmission = transformedSubmissions[0];

    const actions = getAllowedActions(
      userName,
      userType,
      userRole,
      currentSubmission?.phaseKey,
      currentSubmission?.currentStatus
    );

    const result = {
      service: {
        ...service.toJSON(),
        submissions: transformedSubmissions,
      },
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
    if (userType === "entity") {
      whereClause.entityId = entity.guid;
    } else if (userType === "dda") {
      const entityIds = entities.map((e) => e.guid);
      whereClause.entityId = { [Op.in]: entityIds };
    }

    const services = await Services.findAll({
      where: whereClause,
      attributes: ["id", "dguid", "nameEn", "nameAr"],
    });

    const serviceGuids = services.map((s) => s.dguid);

    const submissions = await Submissions.findAll({
      where: { serviceId: { [Op.in]: serviceGuids } },
      include: [
        {
          model: SubmissionsStatus,
          as: "submissionsStatus",
          required: false,
          attributes: ["dguid", "status", "comment", "createdAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const submissionsByService = submissions.reduce((acc, sub) => {
      if (!acc[sub.serviceId]) acc[sub.serviceId] = [];
      acc[sub.serviceId].push(sub);
      return acc;
    }, {});

    const filteredServices = services.filter((service) => {
      const serviceSubs = submissionsByService[service.dguid] || [];
      if (serviceSubs.length === 0) return false;

      const sortedSubs = [...serviceSubs].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      if (userType !== "entity") {
        const defineSubmission = sortedSubs.find(
          (sub) => sub.phaseKey === process.env.DEFINE_PHASE_KEY
        );

        if (defineSubmission) {
          const sortedDefineStatuses = [
            ...(defineSubmission.submissionsStatus || []),
          ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const latestDefineStatus = sortedDefineStatuses[0]?.status;

          if (latestDefineStatus === SubmissionStatus.DRAFT) {
            return false;
          }
        }
      }

      if (userRole === "technical") {
        const defineSubmission = sortedSubs.find(
          (sub) => sub.phaseKey === process.env.DEVELOPMENT_PHASE_KEY
        );

        if (defineSubmission) {
          return true;
        }
      }

      return true;
    });

    const transformedServices = filteredServices.map((service) => {
      const serviceSubs = submissionsByService[service.dguid] || [];

      const groupedSubs = {};

      for (const submission of serviceSubs) {
        const phaseKey = submission.phaseKey;
        const statuses = submission.submissionsStatus || [];

        const sortedStatuses = statuses.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const currentStatus = sortedStatuses[0]?.status?.toUpperCase() || null;

        if (userType !== "entity" && currentStatus === "DRAFT") {
          continue;
        }

        const existing = groupedSubs[phaseKey];
        const existingCreatedAt = existing?.submission?.createdAt || 0;
        const newCreatedAt = new Date(submission.createdAt).getTime();

        if (!existing || newCreatedAt > existingCreatedAt) {
          groupedSubs[phaseKey] = {
            submission,
            currentStatus,
          };
        }
      }

      const submissions = {};
      for (const [phaseKey, { submission, currentStatus }] of Object.entries(
        groupedSubs
      )) {
        const subJson = submission.toJSON();
        delete subJson.submissionsStatus;

        submissions[phaseKey] = {
          ...subJson,
          currentStatus,
        };
      }

      const allChosenSubs = Object.values(groupedSubs).map((s) => s.submission);
      const currentSubmission = allChosenSubs.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      const currentStatuses = currentSubmission?.submissionsStatus || [];
      const sortedStatuses = currentStatuses.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const currentStatus = sortedStatuses[0]?.status || null;

      const actions = getAllowedActions(
        userName,
        userType,
        userRole,
        currentSubmission?.phaseKey,
        currentStatus
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

    if (!actions.includes(action)) {
      return res.json(
        errorResponse("You are not authorized to perform this action", 403)
      );
    }

    if (action.includes("submit")) {
      return await submitPhase(
        req,
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
        serviceId,
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
        serviceId,
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

const submitPhase = async (req, res, submissionId, currentStatus, comment) => {
  if (
    currentStatus !== SubmissionStatus.DRAFT &&
    currentStatus !== SubmissionStatus.REJECTED &&
    currentStatus !== SubmissionStatus.BUSINESS_REJECTED &&
    currentStatus !== SubmissionStatus.TECHNICAL_REJECTED
  ) {
    return res.json(errorResponse("Submission can't be SUBMITTED", 400));
  }

  const t = await Services.sequelize.transaction();
  try {
    await SubmissionsStatus.create(
      {
        submissionId,
        status: SubmissionStatus.SUBMITTED,
        comment: comment,
        createdBy: req.user.userName,
      },
      { transaction: t }
    );

    await t.commit();
    return res.json(successResponse(true));
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const approvePhase = async (
  req,
  res,
  serviceId,
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
      approveRejectDevelop(
        req,
        res,
        serviceId,
        submissionId,
        currentStatus,
        false,
        comment
      );
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
          createdBy: req.user.userName,
        },
        { transaction: t }
      );
    }

    await t.commit();
    return res.json(successResponse(true));
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const rejectPhase = async (
  req,
  res,
  serviceId,
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
      approveRejectDevelop(
        req,
        res,
        serviceId,
        submissionId,
        currentStatus,
        true,
        comment
      );
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
          createdBy: req.user.userName,
        },
        { transaction: t }
      );
    }
    await t.commit();
    return res.json(successResponse(true));
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const getEntities = async (req, res) => {
  const userRole = req.user.role;
  const userType = req.user.type;
  const entities = req.entities;

  try {
    if (userType !== "dda" && userRole !== "business") {
      return res.json(
        errorResponse("You are not authorized to view entities", 403)
      );
    }

    return res.json(successResponse(entities));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const getPhase = async (req, res) => {
  try {
    const phases = [
      {
        name: "Define",
        key: process.env.DEFINE_PHASE_KEY,
      },
      {
        name: "Envisioning",
        key: process.env.ENVISIONING_PHASE_KEY,
      },
      {
        name: "Design",
        key: process.env.DESIGN_PHASE_KEY,
      },
      {
        name: "Development",
        key: process.env.DEVELOPMENT_PHASE_KEY,
      },
    ];
    return res.json(successResponse(phases));
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

const approveRejectDevelop = async (
  req,
  res,
  serviceId,
  submissionId,
  currentStatus,
  isReject,
  comment
) => {
  const userRole = req.user.role;
  const userType = req.user.type;

  const t = await Services.sequelize.transaction();
  try {
    if (userRole === "business" && userType === "entity") {
      if (
        currentStatus !== SubmissionStatus.PUSHED_QA &&
        currentStatus !== SubmissionStatus.PUSHED_PRODUCTION &&
        currentStatus !== SubmissionStatus.DDA_BUSINESS_APPROVED
      ) {
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
          status: isReject
            ? SubmissionStatus.BUSINESS_REJECTED
            : SubmissionStatus.BUSINESS_APPROVED,
          comment: comment,
          createdBy: req.user.userName,
        },
        { transaction: t }
      );

      if (currentStatus === SubmissionStatus.DDA_BUSINESS_APPROVED) {
        const submissions = await Submissions.findAll({
          where: { serviceId },
          include: [
            {
              model: SubmissionsStatus,
              as: "submissionsStatus",
              required: false,
              attributes: ["dguid", "status", "comment", "createdAt"],
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        const hasPushedProduction = submissions.some((sub) =>
          (sub.submissionsStatus || []).some(
            (status) => status.status === SubmissionStatus.PUSHED_PRODUCTION
          )
        );
        if (hasPushedProduction) {
          await SubmissionsStatus.create(
            {
              submissionId,
              status: SubmissionStatus.READY_TO_PUBLISH,
              comment: comment,
              createdBy: req.user.userName,
            },
            { transaction: t }
          );
        } else {
          await SubmissionsStatus.create(
            {
              submissionId,
              status: SubmissionStatus.QA_APPROVED,
              comment: comment,
              createdBy: req.user.userName,
            },
            { transaction: t }
          );
        }
      }
    }

    if (userRole === "business" && userType === "dda") {
      if (
        currentStatus !== SubmissionStatus.PUSHED_QA &&
        currentStatus !== SubmissionStatus.PUSHED_PRODUCTION &&
        currentStatus !== SubmissionStatus.BUSINESS_APPROVED
      ) {
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
          status: isReject
            ? SubmissionStatus.DDA_BUSINESS_REJECTED
            : SubmissionStatus.DDA_BUSINESS_APPROVED,
          comment: comment,
          createdBy: req.user.userName,
        },
        { transaction: t }
      );

      if (currentStatus === SubmissionStatus.BUSINESS_APPROVED) {
        const submissions = await Submissions.findAll({
          where: { serviceId },
          include: [
            {
              model: SubmissionsStatus,
              as: "submissionsStatus",
              required: false,
              attributes: ["dguid", "status", "comment", "createdAt"],
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        const hasPushedProduction = submissions.some((sub) =>
          (sub.submissionsStatus || []).some(
            (status) => status.status === SubmissionStatus.PUSHED_PRODUCTION
          )
        );
        if (hasPushedProduction) {
          await SubmissionsStatus.create(
            {
              submissionId,
              status: SubmissionStatus.READY_TO_PUBLISH,
              comment: comment,
              createdBy: req.user.userName,
            },
            { transaction: t }
          );
        } else {
          await SubmissionsStatus.create(
            {
              submissionId,
              status: SubmissionStatus.QA_APPROVED,
              comment: comment,
              createdBy: req.user.userName,
            },
            { transaction: t }
          );
        }
      }
    }

    if (userRole === "technical" && userType === "dda") {
      if (currentStatus !== SubmissionStatus.SUBMITTED) {
        return res.json(
          errorResponse(
            "Submission must be in Approve status before it can be SUBMITTED",
            400
          )
        );
      }

      await SubmissionsStatus.create(
        {
          submissionId,
          status: isReject
            ? SubmissionStatus.DDA_TECHNICAL_REJECTED
            : SubmissionStatus.DDA_TECHNICAL_APPROVED,
          comment: comment,
          createdBy: req.user.userName,
        },
        { transaction: t }
      );
    }

    await t.commit();
  } catch (error) {
    await t.rollback();
    console.error(error);
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
  getEntities,
  getPhase,
};
