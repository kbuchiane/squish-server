const express = require("express");
const { verifyCredentials } = require("../middleware");
const authController = require("../controllers/auth.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials
    ],
    authController.resetPassword
);

router.post("/confirmResetPassword",
    [
        verifyCredentials.checkCredentials,
        verifyCredentials.checkConfirmId
    ],
    authController.confirmResetPassword
);

router.post("/resendResetCode",
    [
        verifyCredentials.checkCredentials
    ],
    authController.resendResetCode
);

module.exports = router;
