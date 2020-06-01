var express = require("express");
const { verifyCredentials } = require("../middleware");
const authController = require("../controllers/auth.controller");

var router = express.Router();

router.post("/",
    [
        verifyCredentials.checkEntries
    ],
    authController.signup
);

router.post("/confirmUser",
    [
        verifyCredentials.checkEntries
    ],
    authController.confirmUser
);

router.post("/resendCode",
    [
        verifyCredentials.checkEntries
    ],
    authController.resendCode
);

module.exports = router;
