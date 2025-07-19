const { errorResponse } = require("../utils/responseHandler");

function authorizeAPI() {
  return async (req, res, next) => {
    const correctClientId = process.env.AUTH_API_CLIENT_ID;
    const correctClientSecret = process.env.AUTH_API_CLIENT_SECRET;
    const clientId = req.headers["clientid"] || null;
    const clientSecret = req.headers["clientsecret"] || null;

    if (correctClientId === clientId && correctClientSecret === clientSecret) {
      next();
    } else {
      return res.status(401).json(
        errorResponse("Not Authorized", 401)
      );
    }
  };
}

module.exports = { authorizeAPI };
