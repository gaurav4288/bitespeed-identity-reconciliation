const express = require("express");
const identityRoutes = require("../modules/identity/identity.routes");

const router = express.Router();

router.use("/", identityRoutes);

module.exports = router;
