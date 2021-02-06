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
        browseGamesController.browseGamesPage1,  // step 1
        auth.verifyToken, // step 2 (has no console log statement)
        caching.check, // step 3
        caching.get  // step 4
    ],
    gameController.browseGamesPage, //step 5
    followController.browseGamesPage1, // step 6
    followController.browseGamesPage2,  // step 7
    clipController.browseGamesPage,  // step 8
    caching.set,  // step 9
    browseGamesController.browseGamesPage2  // step 10
);

module.exports = router;