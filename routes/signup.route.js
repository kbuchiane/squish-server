const express = require("express");
const { verifyCredentials } = require("../middleware");
const authController = require("../controllers/auth.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials
    ],
    authController.signup
);

router.post("/confirmUser",
    [
        verifyCredentials.checkCredentials,
        verifyCredentials.checkConfirmId
    ],
    authController.confirmUser
);

router.post("/resendCode",
    [
        verifyCredentials.checkCredentials
    ],
    authController.resendCode
);

module.exports = router;
