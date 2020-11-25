const express = require("express");
const { verifyCredentials } = require("../middleware");
const authController = require("../controllers/auth.controller");
const router = express.Router();

router.get("/",
    [
        verifyCredentials.checkRefreshToken
    ],
    authController.refreshToken
);

module.exports = router;