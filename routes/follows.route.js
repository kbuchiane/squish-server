const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const userActionsController = require("../controllers/follow.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
   userActionsController.follows
);

router.post("/followGame",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    userActionsController.followGame
);

router.post("/followUser",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    userActionsController.followUser
);

router.post("/unfollowGame",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    userActionsController.unfollowGame
);

router.post("/unfollowUser",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    userActionsController.unfollowUser
);

module.exports = router;
