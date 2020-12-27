const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const userActionsController = require("../controllers/userActions.controller");
const router = express.Router();


router.post("/",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    userActionsController.followUser
);

module.exports = router;