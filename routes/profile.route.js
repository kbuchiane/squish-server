const express = require("express");
const router = express.Router();

// Middleware
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const { caching } = require("../middleware");

// Controllers
const gameController = require("../controllers/game.controller");
const profileController = require("../controllers/profile.controller");
const followController = require("../controllers/follow.controller");
const clipController = require("../controllers/clip.controller");
const userController = require("../controllers/user.controller");

// FIXME update so page is /profile/username (when user is logged in)

// Generates data for Profile page
router.get("/profile",
  [
    verifyCredentials.checkCredentials,
    profileController.profilePageStart,
    auth.verifyToken,
    caching.check,
    caching.get
  ],

  clipController.profilePage,
  userController.getUserProfileForClips,
  gameController.getGameData,
  followController.getGamesFollowedByUser,
  followController.getGameFollowerCount,
  caching.set,
  profileController.profilePageComplete
);

module.exports = router;