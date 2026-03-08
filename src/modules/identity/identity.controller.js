const { asyncHandler } = require("../../utils/asyncHandler");
const identityService = require("./identity.service");

const identify = asyncHandler(async (req, res) => {
  const result = await identityService.identify(req.body);
  res.status(200).json(result);
});

module.exports = {
  identify
};
