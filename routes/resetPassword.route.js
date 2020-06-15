const express = require("express");
const { verifyCredentials } = require("../middleware");
const authController = require("../controllers/auth.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkEntries
    ],
    authController.resetPassword
);

router.post("/confirmResetPassword",
    [
        verifyCredentials.checkEntries
    ],
    authController.confirmResetPassword
);

/*
router.post("/resendResetCode",
    [
        verifyCredentials.checkEntries
    ],
    authController.resendResetCode
);
*/

module.exports = router;
