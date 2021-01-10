const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const clipController = require("../controllers/clip.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    clipController.postClip
);

module.exports = router;
