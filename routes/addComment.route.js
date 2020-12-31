const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const commentController = require("../controllers/comment.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    commentController.addComment
);

module.exports = router;
