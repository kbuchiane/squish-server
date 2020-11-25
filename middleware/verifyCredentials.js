const appConfig = require("../config/app.config");
const logger = require("../utils/logger");

checkCredentials = (req, res, next) => {
    let username = null;
    let email = req.body.email;
    let password = null;

    let authorization = req.headers.authorization;
    if (authorization) {
        if (authorization.startsWith("Basic")) {
            let encoded = authorization.substring("Basic ".length).trim();
            let decoded = Buffer.from(encoded, "base64").toString();
            let creds = decoded.split(":");

            if (creds.length > 0) {
                userId = creds[0];

                if (userId.includes("@")) {
                    email = userId;

                    if (!username) {
                        req.username = null;
                    }
                } else {
                    username = userId;

                    if (!email) {
                        req.email = null;
                    }
                }
            }

            if (creds.length > 1) {
                password = creds[1];
            }
        } else if (authorization.startsWith("Bearer")) {
            let bearerJwt = authorization.split(" ");
            req.jwt = bearerJwt[1];
        } else {
            return res.status(401).send({
                message: "Invalid authorization method"
            });
        }
    }

    if (username) {
        if (username.length <= 0) {
            return res.status(400).send({
                message: "Please enter a username"
            });
        } else if (/\s/.test(username)) {
            return res.status(400).send({
                message: "Username can not include spaces"
            });
        } else if (!(/^[a-z0-9]+$/i.test(username))) {
            return res.status(400).send({
                message: "Username can not include special characters"
            });
        } else if (username.length > 45) {
            return res.status(400).send({
                message: "Username can not exceed 45 characters"
            });
        }

        req.username = username;
    }

    if (email) {
        if (email.length <= 0) {
            return res.status(400).send({
                message: "Please enter an email"
            });
        } else if (/\s/.test(email)) {
            return res.status(400).send({
                message: "Email can not include spaces"
            });
        } else if (email.length > 255) {
            return res.status(400).send({
                message: "Email can not exceed 255 characters"
            });
        } else if (email.includes(":")) {
            return res.status(400).send({
                message: "Email can not include ':'"
            });
        } else if (!email.includes("@")) {
            return res.status(400).send({
                message: "Email must include '@'"
            });
        }

        req.email = email;
    }

    if (password) {
        if (password.length <= 6) {
            return res.status(400).send({
                message: "Password must be more than 6 characters"
            });
        } else if (password.includes(":")) {
            return res.status(400).send({
                message: "Password can not include ':'"
            });
        }

        req.password = password;
    }

    next();
};

checkRefreshToken = (req, res, next) => {
    let refreshToken = req.signedCookies[appConfig.REFRESH_TOKEN];

    if (refreshToken) {
        if (refreshToken.length <= 0) {
            logger.warn("Could not refresh session for user " + user + " [" + email + "]");
            return res.status(401).send({
                message: "Could not refresh session"
            });
        }

        req.refreshToken = refreshToken;
    }

    next();
};

checkConfirmId = (req, res, next) => {
    let confirmId = req.body.confirmId;

    if (confirmId) {
        if (confirmId.length != 8) {
            return res.status(400).send({
                message: "Verification code must be 8 characters"
            });
        }

        req.confirmId = confirmId;
    } else {
        req.confirmId = null;
    }

    next();
};

const verifyCredentials = {
    checkCredentials: checkCredentials,
    checkRefreshToken: checkRefreshToken,
    checkConfirmId: checkConfirmId
};

module.exports = verifyCredentials;