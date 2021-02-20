const express = require("express");
const router = express.Router();

// Middleware
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const { caching } = require("../middleware");

// Controllers
const gameController = require("../controllers/game.controller");
const browseGamesController = require("../controllers/browseGames.controller");
const followController = require("../controllers/follow.controller");
const clipController = require("../controllers/clip.controller");

// FIXME update so page is /browseGame/username

// Generate data for browseGames page
router.get("/browseGames",
    [
        verifyCredentials.checkCredentials,
        browseGamesController.browseGamesPage1,
        auth.verifyToken,
        caching.check,
        caching.get
    ],
    gameController.browseGamesPage,
    followController.getGamesFollowedByUser,
    followController.getGameFollowerCount,
    clipController.getClipCountsforGames,
    caching.set,
    browseGamesController.browseGamesPage2
);

module.exports = router;