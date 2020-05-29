const winston = require("winston");
const loggerServer = winston.loggers.get("squish-server");
const loggerConsole = winston.loggers.get("squish-console");

var express = require("express");
var router = express.Router();

router.post("/", function (req, res, next) {
    var refreshToken = req.cookies["refresh-token"];
    loggerConsole.info("logout refreshToken: " + refreshToken);

    var bearerJwt = req.headers.authorization.split(" ");
    var jwt = bearerJwt[1];
    loggerConsole.info("jwt: " + jwt);

    // temp as an example for later calls:
    // make sure jwt is legit
    // if jwt is not legit return unauthorized
    // if jwt is legit but expired return to get refresh token
    // if refresh token is legit send new jwt and original request response

    return res.status(200).send({
        message: "Logout success"
    });
});

module.exports = router;