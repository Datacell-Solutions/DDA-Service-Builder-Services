const axios = require("axios");
const { errorResponse } = require("../utils/responseHandler");

function exchangeToken() {
  return async (req, res, next) => {
    const clientId = process.env.ADMIN_API_CLIENT_ID;
    const clientSecret = process.env.ADMIN_API_CLIENT_SECRET;
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .json(errorResponse("Valid authorization token is required", 401));
    }

    const token = authHeader.split(" ")[1];

    try {
      const response = await axios.post(
        `${process.env.ADMIN_API_URL}/Identity/token/exchange`,
        {},
        {
          headers: {
            ClientId: clientId,
            ClientSecret: clientSecret,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = response.data;

      if (response.status !== 200 || responseData?.Status !== 200) {
        return res
          .json(errorResponse(responseData?.Error || "Failed to exchange token", 401));
      }

      req.user = responseData.Data.user;
      if (responseData.Data.user.type === "entity") {
        req.entity = responseData.Data.entity;
      } else if (responseData.Data.user.type === "dda") {
        req.entities = responseData.Data.entity;
      }
      
      next();
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.Message || "Failed to exchange token";

        return res.json(errorResponse(message, status));
      }

      console.error("Token exchange error:", error);
      return res.json(errorResponse("Internal server error", 500));
    }
  };
}


module.exports = { exchangeToken };
