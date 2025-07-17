const axios = require("axios");
const {
  successResponse,
  errorResponse,
} = require("../../utils/responseHandler");

const getClientToken = async (req, res, next) => {
  const clientId = process.env.ADMIN_API_CLIENT_ID;
  const clientSecret = process.env.ADMIN_API_CLIENT_SECRET;
  const { username, password } = req.body;

  try {
    const response = await axios.post(
      `${process.env.ADMIN_API_URL}/Auth/client/user/login`,
      {
        username,
        password,
      },
      {
        headers: {
          ClientId: clientId,
          ClientSecret: clientSecret,
        },
      }
    );

    const responseData = response.data;
    if (!responseData) throw new Error("Invalid response format");

    const data = responseData.Data;

    if (responseData.Status === 200) {
      const result = {
        token: data.token,
        fullName: data.user.fullName,
        type: data.user.type,
        role: data.user.role,
        entity: data.user.entity,
        logo: data.entity.logo,
      };

      return res.json(successResponse(result));
    } else {
      return res.json(errorResponse(responseData.Error, 401));
    }
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

module.exports = {
  getClientToken,
};
