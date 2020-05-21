const winston = require("winston");
const loggerServer = winston.loggers.get("squish-server");
const loggerConsole = winston.loggers.get("squish-console");

var express = require("express");
var router = express.Router();

router.post("/", function (req, res, next) {
    var bearerJwt = req.headers.authorization.split(" ");
    var jwt = bearerJwt[1];

    loggerConsole.info("jwt: " + jwt);

    loggerServer.info("User: " + req.body.auth.username + " logged out");
    loggerConsole.info("User: " + req.body.auth.username + " logged out");

    return res.status(200).send({
        message: "Logout success"
    });
});

module.exports = router;