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
      "http://94.250.202.7:6661/Auth/client/user/login",
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

    const data = response.data?.Data;
    if (!data) throw new Error("Invalid response format");

    const result = {
      token: data.token,
      fullName: data.user.fullName,
      type: data.user.type,
      role: data.user.role,
      entity: data.user.entity,
      logo: data.entity.logo,
    };

    return res.json(successResponse(result));
   
  } catch (error) {
    console.error(error);
    return res.json(errorResponse("Internal server error", 500));
  }
};

module.exports = {
  getClientToken,
};
