const winston = require("winston");
const loggerServer = winston.loggers.get("squish-server");
const loggerConsole = winston.loggers.get("squish-console");

var express = require("express");
var router = express.Router();

router.post("/", function (req, res, next) {
    loggerServer.info("User " + req.body.auth.username + " logged out");
    loggerConsole.info("User " + req.body.auth.username + " logged out");

    var response = {
        success: true
    };

    res.send(response);
});

module.exports = router;