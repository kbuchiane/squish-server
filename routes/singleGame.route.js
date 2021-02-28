const express = require("express");
const router = express.Router();

// Middleware
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const { caching } = require("../middleware");

// Controllers
const gameController = require("../controllers/game.controller");
const singleGameController = require("../controllers/singleGame.controller");
const clipController = require("../controllers/clip.controller");
const userController = require("../controllers/user.controller");

// Generate data for singleGame page
router.get("/singleGame",
  [
    verifyCredentials.checkCredentials,
    singleGameController.singleGamePage1,
    auth.verifyToken,
    caching.check,
    caching.get
  ],
  clipController.singleGamePage,
  gameController.getGameData,
  userController.getUserProfileForClips,
  caching.set,
  singleGameController.singleGamePage2
);

module.exports = router;