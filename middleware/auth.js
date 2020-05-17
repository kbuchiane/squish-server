const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const winston = require("winston");
const loggerServer = winston.loggers.get("squish-server");
const loggerConsole = winston.loggers.get("squish-console");

verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send({
            message: "No token provided for request"
        });
    }

    jwt.verify(token, authConfig.AUTH_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: "Unauthorized request"
            });
        }

        req.userAuthId = decoded.id;
        next();
    });
};

const auth = {
    verifyToken: verifyToken
};

module.exports = auth;