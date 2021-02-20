const express = require("express");
const router = express.Router();

// Middleware
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const { caching } = require("../middleware");

// Controllers
const gameController = require("../controllers/game.controller");
const singleGameController = require("../controllers/singleGame.controller");
const followController = require("../controllers/follow.controller");
const clipController = require("../controllers/clip.controller");
const userController = require("../controllers/user.controller");


// FIXME update so page is /singleGame/username (when user is logged in)

// Generate data for singleGame page
router.get("/singleGame",
    [
        verifyCredentials.checkCredentials,
        singleGameController.singleGamePage1,  // step 1
        auth.verifyToken, // step 2 (has no console log statement)
        caching.check, // step 3
        caching.get  // step 4
    ],

   clipController.singleGamePage,  // step 5

   
  userController.getUserProfileForClips,  // step 6
  
  /*

    gameController.profilePage, //step 7

    followController.profilePage1, // step 8
    followController.profilePage2,  // step 9

  //  clipController.browsePage2,  // step 10
*/

    caching.set,  // step 11
    singleGameController.singleGamePage2  // step 12
);

module.exports = router;