const successResponse = (data) => ({
    code: 200,
    errorMsg: null,
    data,
});

const errorResponse = (errorMsg, code) => ({
    code,
    errorMsg,
    data: null,
});

module.exports = { successResponse, errorResponse };