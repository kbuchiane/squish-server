const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const authController = require("../controllers/auth.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkRefreshToken
    ],
    authController.logout
);

module.exports = router;