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
const likeClipController = require("../controllers/likeClip.controller");
const followController = require("../controllers/follow.controller");


// Generate data for singleGame page
router.get("/singleGame",
  [
    verifyCredentials.checkCredentials,
    singleGameController.singleGamePage1,
    auth.verifyToken,
    caching.check,
    caching.get
  ],
  userController.setLoggedOnUserData,
  clipController.singleGamePage,
  gameController.getGameData,
  likeClipController.getUserLikesForClips,
  likeClipController.getLikeCountsForClips,
  userController.getUserProfileForClips,
  followController.getUserFollowerCount,
  
  followController.getGameFollowerCount,
  clipController.getClipCountsforGames,

  caching.set,
  singleGameController.singleGamePage2
);

module.exports = router;