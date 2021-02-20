const express = require("express");
const { auth } = require("../middleware");
const { verifyCredentials } = require("../middleware");
const gameController = require("../controllers/game.controller");
const router = express.Router();

router.post("/",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    gameController.games
);

router.post("/addGame",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    gameController.addGame
);

router.post("/deleteGame",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    gameController.deleteGame
);

router.get("/getGame",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    gameController.getGame
);

router.get("/getGames",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    gameController.getGames
);

/*  MOVED
router.get("/browseGames",
    [
        verifyCredentials.checkCredentials,
        auth.verifyToken
    ],
    gameController.browseGames
);
*/


module.exports = router;