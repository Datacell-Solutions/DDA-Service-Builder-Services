const {
  Services,
  Submissions,
  SubmissionsStatus,
  ServiceEnvisioning,
  ServiceFlows,
} = require("../models");
const { errorResponse } = require("../../utils/responseHandler");
const {
  SubmissionStatus,
  getAllowedActions,
} = require("../../utils/actionMatrixHandler");

const addServiceDesign = async (req, res) => {
  const {
    figmaDesignLink,
    figmaPreviewLink,
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

module.exports = {
  authorizeEntityUserToSubmit,
  addEnvisioning,
  updateEnvisioning,
  getEnvisioning,
  upload,
};
