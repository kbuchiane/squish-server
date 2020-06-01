var express = require("express");
const { verifyCredentials } = require("../middleware");
const authController = require("../controllers/auth.controller");

var router = express.Router();

router.get("/",
    [
        verifyCredentials.checkEntries
    ],
    authController.refreshToken
);

module.exports = router;