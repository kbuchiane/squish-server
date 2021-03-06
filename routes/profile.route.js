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
const likeClipController = require("../controllers/likeClip.controller");

// Generates data for Profile page
router.get("/profile",
  [
    verifyCredentials.checkCredentials,
    profileController.profilePageStart,
    auth.verifyToken,
    caching.check,
    caching.get
  ],
  userController.setLoggedOnUserData,
  clipController.profilePage,
  likeClipController.getUserLikesForClips,
  likeClipController.getLikeCountsForClips,
  userController.getUserProfileForClips,
  gameController.getGameData,
  followController.getGamesFollowedByUser,
  followController.getGameFollowerCount,
  followController.getUserFollowingForUser,
  followController.getUserFollowerCount,
  caching.set,
  profileController.profilePageComplete
);

module.exports = router;