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

const SubmissionStatus = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

//Add createdBy and updatedBy fields
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

    const result = {
      ...service.toJSON(),
      submissions: transformedSubmissions,
    };

    return res.json(successResponse(result));
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const getAllServices = async (req, res) => {
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

    // Transform each service and their submissions to include `currentStatus`
    const transformedServices = services.map((service) => {
      const submissions =
        service.submissions?.map((submission) => {
          const submissionJson = submission.toJSON();
          const statuses = submissionJson.submissionsStatus || [];
          const currentStatus = statuses.length > 0 ? statuses[0].status : null;

          // Remove submissionsStatus
          delete submissionJson.submissionsStatus;

          return {
            ...submissionJson,
            currentStatus,
          };
        }) || [];

      return {
        ...service.toJSON(),
        submissions,
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
  const { serviceId, action, comment, userRole, userType } = req.params;
  //const userRole = "";
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

    switch (action) {
      case "define.submit":
        if (userType !== "entity" && userRole !== "business") {
          return res.json(
            errorResponse(
              "You are not authorized to perform this action",
              403
            )
          );
        }
        if (newService.submissions.length > 0) {
          const lastSubmission = newService.submissions[0];
          if (lastSubmission.currentStatus !== SubmissionStatus.DRAFT) {
            return res.json(
              errorResponse(
                "Submission must be in DRAFT status before it can be SUBMITTED",
                400
              )
            );
          }
          return await submitPhase(lastSubmission.dguid, action, comment);
        } else {
          return res
            .status(500)
            .json(errorResponse("Internal server error", 500));
        }
      case "define.approve":
        if (userType !== "entity" && userRole !== "business") {
          return res.json(
            errorResponse(
              "You are not authorized to perform this action",
              403
            )
          );
        }
        if (newService.submissions.length > 0) {
          const lastSubmission = newService.submissions[0];
          if (lastSubmission.currentStatus !== SubmissionStatus.SUBMITTED) {
            return res.json(
              errorResponse(
                "Submission must be in SUBMIT status before it can be APPROVED",
                400
              )
            );
          }
          return await approvePhase(lastSubmission.dguid, action, comment);
        } else {
          return res
            .status(500)
            .json(errorResponse("Internal server error", 500));
        }
      case "define.reject":
        if (userType !== "entity" && userRole !== "business") {
          return res.json(
            errorResponse(
              "You are not authorized to perform this action",
              403
            )
          );
        }
        if (newService.submissions.length > 0) {
          const lastSubmission = newService.submissions[0];
          if (lastSubmission.currentStatus !== SubmissionStatus.SUBMITTED) {
            return res.json(
              errorResponse(
                "Submission must be in SUBMIT status before it can be REJECTED",
                400
              )
            );
          }
          return await rejectPhase(lastSubmission.dguid, action, comment);
        } else {
          return res
            .status(500)
            .json(errorResponse("Internal server error", 500));
        }
      default:
        return res.json(errorResponse("Invalid action", 400));
    }
  } catch (error) {
    console.error("approveStep error:", error);
    return res.status(500).json(errorResponse("Internal server error", 500));
  }
};

const submitPhase = async (submissionId, comment) => {
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

const approvePhase = async (submissionId, comment) => {
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

const rejectPhase = async (submissionId, comment) => {
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

module.exports = {
  addService,
  updateService,
  getService,
  getAllServices,
  submitUserAction,
  getSubmissionDetails,
};
