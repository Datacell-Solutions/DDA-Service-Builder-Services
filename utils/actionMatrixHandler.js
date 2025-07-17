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
      DRAFT: ["develop.submit"],
      SUBMITTED: [],
      BUSINESS_APPROVED: [],
      BUSINESS_REJECTED: ["develop.submit"],
      TECHNICAL_APPROVED: [],
      TECHNICAL_REJECTED: ["develop.submit"],
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
module.exports = { SubmissionStatus, getAllowedActions };
