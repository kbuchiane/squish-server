const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth.config");

verifyToken = (req, res, next) => {
    let token = req.jwt;

    if (!token) {
        return res.status(403).send({
            message: "No token provided for request"
        });
    } else {
        jwt.verify(token, authConfig.AUTH_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).send({
                    message: "Unauthorized request"
                });
            } else {
                req.userAuthId = decoded.id;
                next();
            }
        });
    }
};

const auth = {
    verifyToken: verifyToken
};

module.exports = auth;