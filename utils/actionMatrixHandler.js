const SubmissionStatus = Object.freeze({
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  TECHNICAL_APPROVED: "TECHNICAL APPROVED",
  TECHNICAL_REJECTED: "TECHNICAL REJECTED",
  DDA_TECHNICAL_APPROVED: "DDA TECHNICAL APPROVED",
  DDA_TECHNICAL_REJECTED: "DDA TECHNICAL REJECTED",
  PUSHED_QA: "PUSHED QA",
  BUSINESS_APPROVED: "BUSINESS APPROVED",
  BUSINESS_REJECTED: "BUSINESS REJECTED",
  DDA_BUSINESS_APPROVED: "DDA BUSINESS APPROVED",
  DDA_BUSINESS_REJECTED: "DDA BUSINESS REJECTED",
  QA_APPROVED: "QA APPROVED",
  PUSHED_PRODUCTION: "PUSHED PRODUCTION",
  READY_TO_PUBLISH: "READY TO PUBLISH",
  PUBLISHED: "PUBLISHED",
});

const actions = Object.freeze({
  defineSubmit: "define.submit",
  defineApprove: "define.approve",
  defineReject: "define.reject",

  envisioningDraft: "envisioning.draft",
  envisioningSubmit: "envisioning.submit",
  envisioningApprove: "envisioning.approve",
  envisioningReject: "envisioning.reject",

  designDraft: "design.draft",
  designSubmit: "design.submit",
  designApprove: "design.approve",
  designReject: "design.reject",

  developDraft: "develop.draft",
  developSubmit: "develop.submit",
  developApprove: "develop.approve",
  developReject: "develop.reject",
  developPushQA: "develop.push.qa",
  developPushProduction: "develop.push.production",
  developPublish: "develop.publish",
});

const actionsMatrix = {
  [process.env.DEFINE_PHASE_KEY]: {
    "entity business": {
      [SubmissionStatus.DRAFT]: [actions.defineSubmit],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.APPROVED]: [actions.envisioningDraft],
      [SubmissionStatus.REJECTED]: [actions.defineSubmit],
    },
    "entity technical": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    },
    "dda business": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [actions.defineApprove, actions.defineReject],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    },
    "dda technical": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    },
  },

  [process.env.ENVISIONING_PHASE_KEY]: {
    "entity business": {
      [SubmissionStatus.DRAFT]: [actions.envisioningSubmit],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.APPROVED]: [actions.designDraft],
      [SubmissionStatus.REJECTED]: [actions.envisioningSubmit],
    },
    "entity technical": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    },
    "dda business": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [actions.envisioningApprove, actions.envisioningReject],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    },
    "dda technical": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    },
  },

  [process.env.DESIGN_PHASE_KEY]: {
    "entity business": {
      [SubmissionStatus.DRAFT]: [actions.designSubmit],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.APPROVED]: ["develop.draft"],
      [SubmissionStatus.REJECTED]: [actions.designSubmit],
    },
    "entity technical": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    },
    "dda business": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [actions.designApprove, actions.designReject],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    },
    "dda technical": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.APPROVED]: [],
      [SubmissionStatus.REJECTED]: [],
    },
  },

  [process.env.DEVELOPMENT_PHASE_KEY]: {
    "entity business": {
      [SubmissionStatus.DRAFT]: [actions.developSubmit],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.BUSINESS_APPROVED]: [],
      [SubmissionStatus.BUSINESS_REJECTED]: [actions.developSubmit],
      [SubmissionStatus.DDA_BUSINESS_APPROVED]: [actions.developApprove, actions.developReject],
      [SubmissionStatus.DDA_BUSINESS_REJECTED]: [actions.developSubmit],
      [SubmissionStatus.TECHNICAL_APPROVED]: [],
      [SubmissionStatus.TECHNICAL_REJECTED]: [actions.developSubmit],
      [SubmissionStatus.PUSHED_QA]: [actions.developApprove, actions.developReject],
      [SubmissionStatus.PUSHED_PRODUCTION]: [actions.developApprove, actions.developReject],
      [SubmissionStatus.QA_APPROVED]: [],
      [SubmissionStatus.PUBLISHED]: [],
      [SubmissionStatus.READY_TO_PUBLISH]: [],
    },
    "entity technical": {
      [SubmissionStatus.DRAFT]: [actions.developSubmit],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.BUSINESS_APPROVED]: [],
      [SubmissionStatus.BUSINESS_REJECTED]: [actions.developSubmit],
      [SubmissionStatus.DDA_BUSINESS_APPROVED]: [],
      [SubmissionStatus.DDA_BUSINESS_REJECTED]: [actions.developSubmit],
      [SubmissionStatus.TECHNICAL_APPROVED]: [],
      [SubmissionStatus.TECHNICAL_REJECTED]: [actions.developSubmit],
      [SubmissionStatus.PUSHED_QA]: [],
      [SubmissionStatus.PUSHED_PRODUCTION]: [],
      [SubmissionStatus.QA_APPROVED]: [],
      [SubmissionStatus.PUBLISHED]: [],
      [SubmissionStatus.READY_TO_PUBLISH]: [],
    },
    "dda business": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [],
      [SubmissionStatus.BUSINESS_APPROVED]: [actions.developApprove, actions.developReject],
      [SubmissionStatus.BUSINESS_REJECTED]: [],
      [SubmissionStatus.DDA_BUSINESS_APPROVED]: [],
      [SubmissionStatus.DDA_BUSINESS_REJECTED]: [],
      [SubmissionStatus.TECHNICAL_APPROVED]: [],
      [SubmissionStatus.TECHNICAL_REJECTED]: [],
      [SubmissionStatus.PUSHED_QA]: [actions.developApprove, actions.developReject],
      [SubmissionStatus.PUSHED_PRODUCTION]: [actions.developApprove, actions.developReject],
      [SubmissionStatus.QA_APPROVED]: [],
      [SubmissionStatus.PUBLISHED]: [],
      [SubmissionStatus.READY_TO_PUBLISH]: [],
    },
    "dda technical": {
      [SubmissionStatus.DRAFT]: [],
      [SubmissionStatus.SUBMITTED]: [actions.developApprove, actions.developReject],
      [SubmissionStatus.BUSINESS_APPROVED]: [],
      [SubmissionStatus.BUSINESS_REJECTED]: [],
      [SubmissionStatus.DDA_BUSINESS_APPROVED]: [],
      [SubmissionStatus.DDA_BUSINESS_REJECTED]: [],
      [SubmissionStatus.TECHNICAL_APPROVED]: [actions.developPushQA],
      [SubmissionStatus.TECHNICAL_REJECTED]: [],
      [SubmissionStatus.PUSHED_QA]: [],
      [SubmissionStatus.PUSHED_PRODUCTION]: [],
      [SubmissionStatus.QA_APPROVED]: [actions.developPushProduction],
      [SubmissionStatus.PUBLISHED]: [],
      [SubmissionStatus.READY_TO_PUBLISH]: [actions.developPublish],
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
module.exports = { SubmissionStatus, getAllowedActions };
