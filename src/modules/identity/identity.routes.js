const express = require("express");
const { identify } = require("./identity.controller");

const router = express.Router();

router.post("/identify", identify);

module.exports = router;
