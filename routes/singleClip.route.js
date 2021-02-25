const express = require("express");
const router = express.Router();

// Middleware
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const { caching } = require("../middleware");

// Controllers
const gameController = require("../controllers/game.controller");
const singleClipController = require("../controllers/singleClip.controller");
const clipController = require("../controllers/clip.controller");
const userController = require("../controllers/user.controller");

// FIXME update so page is /singleClip/clipId

// Generate data for singleClip page
router.get("/singleClip",
  [
    verifyCredentials.checkCredentials,
    singleClipController.singleClipPage1,
    auth.verifyToken,
    caching.check,
    caching.get
  ],
  clipController.singleClipPage,
  userController.getUserProfileForClips,
  gameController.getGameData,
  caching.set,
  singleClipController.singleClipPage2
);

module.exports = router;