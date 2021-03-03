const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const likeCommentController = require("../controllers/likeComment.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeCommentController.likeComment
);

router.post("/likeComment",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeCommentController.likeComment
);

router.post("/unlikeComment",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeCommentController.unlikeComment
);

module.exports = router;