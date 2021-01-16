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
    commentController.comments
);

router.post("/addComment",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    commentController.addComment
);

router.post("/deleteComment",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    commentController.deleteComment
);

module.exports = router;
