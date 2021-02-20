const express = require("express");
const router = express.Router();

// Middleware
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const { caching } = require("../middleware");

// Controllers
const gameController = require("../controllers/game.controller");
const browseController = require("../controllers/browse.controller");
const followController = require("../controllers/follow.controller");
const clipController = require("../controllers/clip.controller");
const userController = require("../controllers/user.controller");

// FIXME update so page is /browse/username (when user is logged in)

// Generate data for browse page
router.get("/browse",
    [
        verifyCredentials.checkCredentials,
        browseController.browsePage1,
        auth.verifyToken,
        caching.check,
        caching.get
    ],
    clipController.browsePage,
    userController.getUserProfileForClips,
    gameController.getGameData,
    followController.getGamesFollowedByUser,
    followController.getGameFollowerCount,
    clipController.getClipCountsforGames,
    caching.set,
    browseController.browsePage2
);

module.exports = router;