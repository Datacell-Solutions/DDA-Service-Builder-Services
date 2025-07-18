const {
  Services,
  Submissions,
  SubmissionsStatus,
  ServiceScreensDev,
  ServiceScreensQA,
} = require("../models");
const {
  errorResponse,
  successResponse,
} = require("../../utils/responseHandler");
const {
  SubmissionStatus,
  getAllowedActions,
} = require("../../utils/actionMatrixHandler");

const addServiceScreen = async (req, res) => {
  const { serviceId, title, json, isDefault } = req.body;
  const userName = req.user.userName;
  const entityId = req.entity.guid;
  const userRole = req.user.role;
  const userType = req.user.type;

  const phaseKey = process.env.DEVELOPMENT_PHASE_KEY;

  const t = await Services.sequelize.transaction();
  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: { include: ["id", "nameEn"] },
    });

    if (!service) {
      return res.json(errorResponse("Service not found", 404));
    }

    if (isDefault) {
      await ServiceScreensDev.update(
        { isDefault: false },
        {
          where: { serviceId },
          transaction: t,
        }
      );
    }

    await ServiceScreensDev.create(
      {
        serviceId,
        title,
        json,
        isDefault,
        createdBy: userName,
      },
      { transaction: t }
    );

    const existingSubmission = await Submissions.findOne({
      where: {
        serviceId,
        phaseKey,
      },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });

    if (existingSubmission) {
      const latestStatus = await SubmissionsStatus.findOne({
        where: {
          submissionId: existingSubmission.dguid,
        },
        order: [["createdAt", "DESC"]],
        transaction: t,
      });

      if (latestStatus && latestStatus.status === SubmissionStatus.DRAFT) {
        const actions = getAllowedActions(
          userName,
          userType,
          userRole,
          phaseKey,
          SubmissionStatus.DRAFT
        );

        await t.commit();
        return res.json(
          successResponse({
            serviceId,
            actions,
          })
        );
      }
    }

    const newSubmission = await Submissions.create(
      {
        serviceId,
        phaseKey,
        createdBy: userName,
      },
      { transaction: t }
    );

    await SubmissionsStatus.create(
      {
        submissionId: newSubmission.dguid,
        status: SubmissionStatus.DRAFT,
        createdBy: userName,
      },
      { transaction: t }
    );

    const actions = getAllowedActions(
      userName,
      userType,
      userRole,
      phaseKey,
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

const pushToQA = async (req, res) => {
  const { serviceId } = req.params;
  const userName = req.user.userName;
  const entityId = req.entity.guid;
  const userRole = req.user.role;
  const userType = req.user.type;

  const phaseKey = process.env.DEVELOPMENT_PHASE_KEY;

  const t = await Services.sequelize.transaction();
  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: { include: ["id", "nameEn"] },
      transaction: t,
    });

    if (!service) {
      await t.rollback();
      return res.json(errorResponse("Service not found", 404));
    }

    if (userRole !== "technical" && userType !== "dda") {
      return res.json(
        errorResponse("You are not authorized to perform this action", 403)
      );
    }

    const devScreens = await ServiceScreensDev.findAll({
      where: { serviceId },
      transaction: t,
    });

    await ServiceScreensQA.destroy({
      where: { serviceId },
      transaction: t,
    });

    for (const screen of devScreens) {
      const { title, json, isDefault } = screen;
      await ServiceScreensQA.create(
        {
          serviceId,
          title,
          json,
          isDefault,
          createdBy: userName,
        },
        { transaction: t }
      );
    }

    let submission = await Submissions.findOne({
      where: { serviceId, phaseKey },
      transaction: t,
    });

    if (!submission) {
      submission = await Submissions.create(
        {
          serviceId,
          phaseKey,
          createdBy: userName,
        },
        { transaction: t }
      );
    }

    await SubmissionsStatus.create(
      {
        submissionId: submission.dguid,
        status: SubmissionStatus.PUSHED_QA,
        createdBy: userName,
      },
      { transaction: t }
    );

    const actions = getAllowedActions(
      userName,
      userType,
      userRole,
      phaseKey,
      SubmissionStatus.PUSHED_QA
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

const pushToProd = async (req, res) => {
  const { serviceId } = req.params;
  const userName = req.user.userName;
  const entityId = req.entity.guid;
  const userRole = req.user.role;
  const userType = req.user.type;

  const phaseKey = process.env.DEVELOPMENT_PHASE_KEY;

  const t = await Services.sequelize.transaction();
  try {
    const service = await Services.findOne({
      where: { dguid: serviceId },
      attributes: { include: ["id", "nameEn"] },
      transaction: t,
    });

    if (!service) {
      await t.rollback();
      return res.json(errorResponse("Service not found", 404));
    }

    const QAScreens = await ServiceScreensQA.findAll({
      where: { serviceId },
      transaction: t,
    });

    let submission = await Submissions.findOne({
      where: { serviceId, phaseKey },
      transaction: t,
    });

    if (!submission) {
      submission = await Submissions.create(
        {
          serviceId,
          phaseKey,
          createdBy: userName,
        },
        { transaction: t }
      );
    }

    await SubmissionsStatus.create(
      {
        submissionId: submission.dguid,
        status: SubmissionStatus.PUSHED_PRODUCTION,
        createdBy: userName,
      },
      { transaction: t }
    );

    const actions = getAllowedActions(
      userName,
      userType,
      userRole,
      phaseKey,
      SubmissionStatus.DRAFT
    );

    await t.commit();
    return res.json(
      successResponse({
        QAScreens,
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
  addServiceScreen,
  pushToQA,
  pushToProd,
};
