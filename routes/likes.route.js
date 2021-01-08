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
    likeController.likes
);

router.post("/likeClip",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeController.likeClip
);

router.post("/likeComment",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeController.likeComment
);

router.post("/unlikeClip",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeController.unlikeClip
);

router.post("/unlikeComment",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeController.unlikeComment
);

module.exports = router;
