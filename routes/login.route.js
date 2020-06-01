var express = require("express");
const { verifyCredentials } = require("../middleware");
const authController = require("../controllers/auth.controller");

var router = express.Router();

router.post("/",
    [
        verifyCredentials.checkEntries
    ],
    authController.login
);

module.exports = router;