const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const likeController = require("../controllers/like.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeController.likeComment
);

module.exports = router;
