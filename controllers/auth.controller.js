const db = require("../models");
const authConfig = require("../config/auth.config");
const email = require("../utils/email");
const winston = require("winston");
const loggerServer = winston.loggers.get("squish-server");
const loggerConsole = winston.loggers.get("squish-console");

const User = db.user;
const Op = db.Sequelize.Op;

const { v4: uuidv4 } = require("uuid");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var moment = require("moment");

function deleteNewUser(username) {
    return new Promise(function (resolve, reject) {
        User.destroy({
            where: {
                username: username
            }
        }).catch(err => {
            loggerServer.warn("User: " + username + ": " + err);
            resolve(false);
        });

        resolve(true);
    });
};

exports.signup = (req, res) => {

    if (!req.username || !req.password || !req.email) {
        return res.status(400).send({
            message: "Email, username, and password are required"
        });
    } else {
        var dateCreated = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

        var userConfirmId = uuidv4();
        userConfirmId = userConfirmId.substring(0, 8);

        var salt = bcrypt.genSaltSync(10);
        var passwordHash = bcrypt.hashSync(req.password, salt);

        User.create({
            username: req.username,
            email: req.email,
            password: passwordHash,
            date_created: dateCreated,
            active: false,
            user_confirm_id: userConfirmId,
            confirm_id_date_created: dateCreated,
            verify_attempt_count: 0,
            admin: false
        }).then(user => {
            email.sendConfirmation(
                user.email,
                user.user_confirm_id
            ).then(emailSuccess => {
                if (!emailSuccess) {
                    deleteNewUser(user.username).then(deleteSuccess => {
                        if (!deleteSuccess) {
                            return res.status(500).send({
                                message: "A rare error occurred (whoops), you may have to try again later using a different username/email or please contact customer service for assistance"
                            });
                        } else {
                            return res.status(500).send({
                                message: "There was an issue sending a confirmation email, please try again later"
                            })
                        }
                    });
                } else {
                    return res.status(200).send({
                        message: "A verification code has been sent to "
                            + user.email
                    });
                }
            });
        }).catch(err => {
            return res.status(500).send({
                message: err.message
            });
        });
    }
};

function codeExpired(datetime) {
    var nowTime = moment();
    var codeTime = moment(datetime);
    var diff = moment.duration(nowTime.diff(codeTime));
    var minuteDiff = diff.minutes();
    var maxMinutes = 4;

    if (minuteDiff < maxMinutes) {
        return false;
    }

    return true;
};

function updateVerificationCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        var newDateCreated =
            moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

        var uuid = uuidv4();
        var newCode = uuid.substring(0, 8);

        User.update({
            user_confirm_id: newCode,
            confirm_id_date_created: newDateCreated,
            verify_attempt_count: 0
        },
            {
                where: {
                    [Op.and]: [
                        { email: emailAddr },
                        { active: false }
                    ]
                }
            }).then(user => {
                if (!user) {
                    loggerServer.warn("User email: "
                        + emailAddr
                        + " not found and could not be updated");
                    resolve(false);
                } else {
                    resolve(newCode);
                }
            }).catch(err => {
                loggerServer.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

function updateAndEmailCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        var ret = {
            status: 200,
            message: ""
        };

        updateVerificationCode(emailAddr).then(updateCode => {
            if (!updateCode) {
                ret.status = 500;
                ret.message = "There was an issue creating a new verification code, please try again later";
                resolve(ret);
            } else {
                email.sendConfirmation(
                    emailAddr,
                    updateCode
                ).then(emailSuccess => {
                    if (!emailSuccess) {
                        ret.status = 500;
                        ret.message = "There was an issue sending a confirmation email, please try again later";
                    } else {
                        resolve(ret);
                    }
                });
            }
        });
    });
};

function addVerifyAttempt(emailAddr) {
    return new Promise(function (resolve, reject) {
        User.increment(
            "verify_attempt_count",
            {
                where: {
                    [Op.and]: [
                        { email: emailAddr },
                        { active: false }
                    ]
                }
            }).then(user => {
                if (!user) {
                    loggerServer.warn("User email: "
                        + emailAddr
                        + " not found and could not be updated");
                    resolve(false);
                } else {
                    resolve(true);
                }
            }).catch(err => {
                loggerServer.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

function updateVerifiedUser(emailAddr) {
    return new Promise(function (resolve, reject) {
        User.update({
            user_confirm_id: null,
            confirm_id_date_created: null,
            verify_attempt_count: 0,
            active: true
        },
            {
                where: {
                    [Op.and]: [
                        { email: emailAddr },
                        { active: false }
                    ]
                }
            }).then(user => {
                if (!user) {
                    loggerServer.warn("User email: "
                        + emailAddr
                        + " could not be verified");
                    resolve(false);
                } else {
                    resolve(true);
                }
            }).catch(err => {
                loggerServer.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

function getRefreshToken(emailAddr) {
    return new Promise(function (resolve, reject) {
        var refreshToken = uuidv4();
        var refreshTokenExpiration =
            moment(Date.now()).add(1, "days").format("YYYY-MM-DD HH:mm:ss");

        User.update({
            refresh_token: refreshToken,
            refresh_token_expiration: refreshTokenExpiration
        },
            {
                where: {
                    [Op.and]: [
                        { email: emailAddr },
                        { active: true }
                    ]
                }
            }).then(user => {
                if (!user) {
                    loggerServer.warn("User email: "
                        + emailAddr
                        + ": could not be given a refresh token");
                    resolve(false);
                } else {
                    resolve(refreshToken);
                }
            }).catch(err => {
                loggerServer.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

exports.confirmUser = (req, res) => {
    if (!req.email || !req.confirmId) {
        return res.status(400).send({
            message: "Email and verification code are required"
        });
    } else {
        User.findOne({
            where: {
                [Op.and]: [
                    { email: req.email },
                    { active: false }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "Email entered was not found, or has already been activated"
                });
            } else if (user.verify_attempt_count === 3) {
                updateAndEmailCode(user.email).then(updateAndEmailCodeRet => {
                    if (updateAndEmailCodeRet.status === 500) {
                        return res.status(500).send({
                            message: "Maximum attempts reached<br />"
                                + updateAndEmailCodeRet.message
                        });
                    } else {
                        return res.status(400).send({
                            message: "Maximum attempts reached, a new verification code has been sent to "
                                + user.email
                        });
                    }
                });
            } else if (codeExpired(user.confirm_id_date_created)) {
                updateAndEmailCode(user.email).then(updateAndEmailCodeRet => {
                    if (updateAndEmailCodeRet.status === 500) {
                        return res.status(500).send({
                            message: "Verification code has expired<br />"
                                + updateAndEmailCodeRet.message
                        });
                    } else {
                        return res.status(400).send({
                            message: "Verification code has expired, a new code has been sent to "
                                + user.email
                        });
                    }
                });
            } else if (user.user_confirm_id != req.confirmId) {
                addVerifyAttempt(user.email).then(addVerifyAttemptRet => {
                    return res.status(400).send({
                        message: "Verification code is incorrect"
                    });
                });
            } else {
                updateVerifiedUser(user.email).then(updateUserRet => {
                    if (!updateUserRet) {
                        return res.status(500).send({
                            message: "There was an issue activating your account, please try again later"
                        });
                    } else {
                        var accessToken = jwt.sign(
                            { id: user.user_id },
                            authConfig.AUTH_SECRET,
                            { expiresIn: authConfig.JWT_EXPIRE_TIME }
                        );

                        getRefreshToken(user.email).then(refreshToken => {
                            if (!refreshToken) {
                                return res.status(500).send({
                                    message: "Account activated, but there was an issue logging in, please try again"
                                });
                            } else {
                                res.cookie("refresh-token", refreshToken);

                                return res.status(200).send({
                                    username: user.username,
                                    accessToken: accessToken
                                });
                            }
                        });
                    }
                });
            }
        }).catch(err => {
            return res.status(500).send({
                message: err.message
            });
        });
    }
};

exports.resendCode = (req, res) => {
    if (!req.email) {
        return res.status(400).send({
            message: "Email is required"
        });
    } else {
        User.findOne({
            where: {
                [Op.and]: [
                    { email: req.email },
                    { active: false }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "Email entered was not found, or has already been activated"
                });
            } else {
                updateAndEmailCode(user.email).then(updateAndEmailCodeRet => {
                    if (updateAndEmailCodeRet.status === 500) {
                        return res.status(500).send({
                            message: updateAndEmailCodeRet.message
                        });
                    } else {
                        return res.status(200).send({
                            message: "A verification code has been sent to "
                                + user.email
                        });
                    }
                });
            }
        }).catch(err => {
            return res.status(500).send({
                message: err.message
            });
        });
    }
};

exports.login = (req, res) => {
    if (!req.password || (!req.username && !req.email)) {
        return res.status(400).send({
            message: "Email or username and password are required"
        });
    } else {
        User.findOne({
            where: {
                [Op.or]: [
                    { username: req.username },
                    { email: req.email }
                ],
                [Op.and]: [
                    { active: true }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "User was not found"
                });
            } else {
                var validPassword = bcrypt.compareSync(
                    req.password,
                    user.password
                );

                if (!validPassword) {
                    return res.status(401).send({
                        message: "Password was invalid"
                    });
                } else {
                    var accessToken = jwt.sign(
                        { id: user.user_id },
                        authConfig.AUTH_SECRET,
                        { expiresIn: authConfig.JWT_EXPIRE_TIME }
                    );

                    getRefreshToken(user.email).then(refreshToken => {
                        if (!refreshToken) {
                            return res.status(500).send({
                                message: "There was an issue logging in, please try again"
                            });
                        } else {
                            res.cookie("refresh-token", refreshToken);

                            return res.status(200).send({
                                username: user.username,
                                accessToken: accessToken
                            });
                        }
                    });
                }
            }
        }).catch(err => {
            return res.status(500).send({
                message: err.message
            });
        });
    }
};

function refreshTokenExpired(datetime) {
    var nowTime = moment();
    var expirationTime = moment(datetime);

    if (nowTime.isBefore(expirationTime)) {
        return false;
    }

    return true;
};

exports.refreshToken = (req, res) => {
    if (!req.refreshToken) {
        return res.status(400).send({
            message: "Refresh token is required"
        });
    } else {
        User.findOne({
            where: {
                [Op.and]: [
                    { refresh_token: req.refreshToken },
                    { active: true }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "Refresh token was not found"
                });
            } else {
                if (refreshTokenExpired(user.refresh_token_expiration)) {
                    return res.status(401).send({
                        message: "Session has expired"
                    });
                } else {
                    var accessToken = jwt.sign(
                        { id: user.user_id },
                        authConfig.AUTH_SECRET,
                        { expiresIn: authConfig.JWT_EXPIRE_TIME }
                    );

                    getRefreshToken(user.email).then(refreshToken => {
                        if (!refreshToken) {
                            return res.status(500).send({
                                message: "There was an issue renewing the session"
                            });
                        } else {
                            res.cookie("refresh-token", refreshToken);

                            return res.status(200).send({
                                username: user.username,
                                accessToken: accessToken
                            });
                        }
                    });
                }
            }
        }).catch(err => {
            return res.status(500).send({
                message: err.message
            });
        });
    }
};