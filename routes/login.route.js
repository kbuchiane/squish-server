const express = require("express");
const { verifyCredentials } = require("../middleware");
const authController = require("../controllers/auth.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials
    ],
    authController.login
);

module.exports = router;