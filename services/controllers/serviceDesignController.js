const {
  Services,
  Submissions,
  SubmissionsStatus,
  ServiceDesigns,
} = require("../models");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHandler");
const {
  SubmissionStatus,
  getAllowedActions,
} = require("../../utils/actionMatrixHandler");

const updateServiceDesign = async (req, res) => {
  const { serviceId, figmaDesignLink, figmaPreviewLink } = req.body;
  const userName = req.user.userName;
  const entityId = req.entity.guid;
  const userRole = req.user.role;
  const userType = req.user.type;

  const t = await Services.sequelize.transaction();
  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: { include: ["id"] },
      transaction: t,
    });

    if (!service) {
      await t.rollback();
      return res.json(errorResponse("Service not found", 404));
    }

    let serviceDesign = await ServiceDesigns.findOne({
      where: { serviceId: serviceId },
      attributes: { include: ["id"] },
      transaction: t,
    });

    if (serviceDesign) {
      await serviceDesign.update(
        {
          figmaDesignLink,
          figmaPreviewLink,
          updatedBy: userName,
        },
        { transaction: t }
      );
    } else {
      serviceDesign = await ServiceDesigns.create(
        {
          serviceId,
          figmaDesignLink,
          figmaPreviewLink,
          createdBy: userName,
        },
        { transaction: t }
      );

      let submission = await Submissions.findOne({
        where: { serviceId, phaseKey: process.env.DESIGN_PHASE_KEY },
      });

      if (!submission) {
        submission = await Submissions.create(
          {
            serviceId,
            phaseKey: process.env.DESIGN_PHASE_KEY,
            createdBy: userName,
          },
          { transaction: t }
        );
      }

      await SubmissionsStatus.create(
        {
          submissionId: submission.dguid,
          status: SubmissionStatus.DRAFT,
          createdBy: userName,
        },
        { transaction: t }
      );
    }

    const actions = getAllowedActions(
      userName,
      userType,
      userRole,
      process.env.DESIGN_PHASE_KEY,
      SubmissionStatus.DRAFT
    );

    await t.commit();

    return res.json(
      successResponse({
        serviceId,
        actions,
      })
    );
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

const getServiceDesign = async (req, res) => {
  const { serviceId } = req.params;

  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: { include: ["id"] },
    });

    if (!service) {
      return res.json(errorResponse("Service not found", 404));
    }

    const serviceDesign = await ServiceDesigns.findOne({
      where: { serviceId },
    });

    if (!serviceDesign) {
      return res.json(errorResponse("Service design not found", 404));
    }

    return res.json(
      successResponse({
        ...serviceDesign.get({ plain: true }),
      })
    );
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

module.exports = {
  updateServiceDesign,
  getServiceDesign,
};
