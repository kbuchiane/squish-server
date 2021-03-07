const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const likeClipController = require("../controllers/likeClip.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeClipController.likeClip
);

router.post("/likeClip",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeClipController.likeClip
);

router.post("/unlikeClip",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    likeClipController.unlikeClip
);

module.exports = router;
