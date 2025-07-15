// controllers/pageController.js
const { AppError } = require("../../../utils/errorHandler.js");
const Clients = require("../models/client.js");
const Sessions = require("../models/sessions.js");
const { sequelize } = require("../../../config/database.js");
const {
  signJwt,
  decryptJwt,
  encryptText,
  decryptText,
} = require("../../../utils/security.js");

const generateGuid = require("../../../utils/guid.js");

// Generate a Token for the Client ID
const getClientToken = async (req, res, next) => {
  try {
    const { client_id, client_secret, scope } = req.body;
    console.log({ client_id });
    const currentClient = await Clients.findOne({
      where: { clientId: client_id, clientSecret: client_secret, isActive: 1 },
    });

    if (!currentClient) {
      return next(new AppError("Invalid Client", 404));
    }

    const sessionId = generateGuid();

    const Session = Sessions.create({
      dguid: sessionId,
      clientId: currentClient.clientId,
      clientScope: currentClient.clientScope,
      createDate: new Date(),
    });

    const jwtPayload = {
      client: currentClient.clientId,
      scope: currentClient.scope,
      session: sessionId,
    };

    const jwtToken = signJwt(jwtPayload);
    console.log({ jwtToken });
    const encryptedToken = encryptText(jwtToken);

    res.status(200).json({
      message: "Success",
      accessToken: encryptedToken,
      // jwtToken
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    next(new AppError("Failed to fetch client", 500));
  }
};

module.exports = {
  getClientToken,
};
