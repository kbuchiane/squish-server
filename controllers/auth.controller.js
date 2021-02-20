const db = require("../models");
const authConfig = require("../config/auth.config");
const appConfig = require("../config/app.config");
const email = require("../utils/email");
const logger = require("../utils/logger");

const User = db.user;
const RefreshToken = db.refreshToken;
const Op = db.Sequelize.Op;
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");

function deleteNewUser(username) {
    return new Promise(function (resolve, reject) {
        User.destroy({
            where: {
                Username: username
            }
        }).catch(err => {
            logger.warn("User: " + username + ": " + err);
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
        let dateCreated = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);

        let userConfirmId = uuidv4();
        userConfirmId = userConfirmId.substring(0, 8);

        let salt = bcrypt.genSaltSync(10);
        let passwordHash = bcrypt.hashSync(req.password, salt);

        User.findOne({
            where: {
                [Op.or]: [
                    { Username: req.username },
                    { Email: req.email }
                ]
            }
        }).then(user => {
            if (user) {
                return res.status(403).send({
                    message: "Username or email already in use"
                })
            } else {
                User.create({
                    Username: req.username,
                    Email: req.email,
                    Password: passwordHash,
                    DateCreated: dateCreated,
                    Active: false,
                    ConfirmId: userConfirmId,
                    ConfirmIdDateCreated: dateCreated,
                    VerifyAttemptCount: 0,
                    Admin: false
                }).then(user => {
                    email.sendConfirmation(
                        user.Email,
                        user.ConfirmId
                    ).then(emailSuccess => {
                        if (!emailSuccess) {
                            deleteNewUser(user.Username).then(deleteSuccess => {
                                if (!deleteSuccess) {
                                    logger.error("Failed to delete user " + user.Username);
                                    return res.status(500).send({
                                        message: "A rare error occurred (whoops), you may have to try again later using a different username/email or please contact customer service for assistance"
                                    });
                                } else {
                                    logger.warn("Failed to send confirmation email for deleting user  " + user.Username);
                                    return res.status(500).send({
                                        message: "There was an issue sending a confirmation email, please try again later"
                                    });
                                }
                            });
                        } else {
                            return res.status(200).send({
                                message: "A verification code has been sent to "
                                    + user.Email
                            });
                        }
                    });
                }).catch(err => {
                    logger.error("Create user error, " + err.message);
                    return res.status(500).send({
                        message: "That username or email may already be taken. Please try again."
                    });
                })
            }
        })
    }
};

function codeExpired(datetime) {
    let nowTime = moment();
    let codeTime = moment(datetime);
    let diff = moment.duration(nowTime.diff(codeTime));
    let minuteDiff = diff.minutes();
    let maxMinutes = 4;

    if (minuteDiff < maxMinutes) {
        return false;
    }

    return true;
};

function updateVerificationCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        let newDateCreated =
            moment(Date.now()).format(appConfig.DB_DATE_FORMAT);

        let uuid = uuidv4();
        let newCode = uuid.substring(0, 8);

        User.update({
            ConfirmId: newCode,
            ConfirmIdDateCreated: newDateCreated,
            VerifyAttemptCount: 0
        },
            {
                where: {
                    [Op.and]: [
                        { Email: emailAddr },
                        { Active: false }
                    ]
                }
            }).then(user => {
                if (!user) {
                    logger.warn("User email: "
                        + emailAddr
                        + " not found and could not be updated");
                    resolve(false);
                } else {
                    resolve(newCode);
                }
            }).catch(err => {
                logger.warn("Unable to update verification code for user email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

function updateAndEmailCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        let ret = {
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
                        resolve(ret);
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
            "VerifyAttemptCount",
            {
                where: {
                    [Op.and]: [
                        { Email: emailAddr },
                        { Active: false }
                    ]
                }
            }).then(user => {
                if (!user) {
                    logger.warn("User email: "
                        + emailAddr
                        + " not found and could not be updated");
                    resolve(false);
                } else {
                    resolve(true);
                }
            }).catch(err => {
                logger.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

function updateVerifiedUser(emailAddr) {
    return new Promise(function (resolve, reject) {
        User.update({
            ConfirmId: null,
            ConfirmIdDateCreated: null,
            VerifyAttemptCount: 0,
            Active: true
        },
            {
                where: {
                    [Op.and]: [
                        { Email: emailAddr },
                        { Active: false }
                    ]
                }
            }).then(user => {
                if (!user) {
                    logger.warn("User email: "
                        + emailAddr
                        + " could not be verified");
                    resolve(false);
                } else {
                    resolve(true);
                }
            }).catch(err => {
                logger.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

function createRefreshToken(emailAddr) {
    return new Promise(function (resolve, reject) {
        let refreshToken = uuidv4();
        let refreshTokenExpiration =
            moment(Date.now()).add(7, "days").format(appConfig.DB_DATE_FORMAT);

        User.findOne({
            where: {
                [Op.and]: [
                    { Email: emailAddr },
                    { Active: true }
                ]
            }
        }).then(user => {
            RefreshToken.create({
                RefreshTokenId: refreshToken,
                RefreshTokenUserId: user.UserId,
                ExpirationDate: refreshTokenExpiration
            }).then(tokenRow => {
                if (!tokenRow) {
                    logger.warn("User email: "
                        + emailAddr
                        + ": could not be given a refresh token");
                    resolve(false);
                } else {
                    resolve(refreshToken);
                }
            }).catch(err => {
                logger.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
        }).catch(err => {
            logger.warn("User email: "
                + emailAddr + ": " + err);
            resolve(false);
        });
    });
};

function updateRefreshToken(oldRefreshToken) {
    return new Promise(function (resolve, reject) {
        let refreshToken = uuidv4();
        let refreshTokenExpiration =
            moment(Date.now()).add(7, "days").format(appConfig.DB_DATE_FORMAT);

        RefreshToken.update({
            RefreshTokenId: refreshToken,
            ExpirationDate: refreshTokenExpiration
        },
            {
                where: {
                    RefreshTokenId: oldRefreshToken
                }
            }).then(user => {
                if (!user) {
                    logger.warn("User email: "
                        + emailAddr
                        + ": could not be given a refresh token");
                    resolve(false);
                } else {
                    resolve(refreshToken);
                }
            }).catch(err => {
                logger.warn("User email: "
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
                    { Email: req.email },
                    { Active: false }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "Email entered was not found, or has already been activated"
                });
            } else if (user.VerifyAttemptCount === 3) {
                updateAndEmailCode(user.Email).then(updateAndEmailCodeRet => {
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
            } else if (codeExpired(user.ConfirmIdDateCreated)) {
                updateAndEmailCode(user.Email).then(updateAndEmailCodeRet => {
                    if (updateAndEmailCodeRet.status === 500) {
                        return res.status(500).send({
                            message: "Verification code has expired<br />"
                                + updateAndEmailCodeRet.message
                        });
                    } else {
                        return res.status(400).send({
                            message: "Verification code has expired, a new code has been sent to "
                                + user.Email
                        });
                    }
                });
            } else if (user.ConfirmId != req.confirmId) {
                addVerifyAttempt(user.Email).then(addVerifyAttemptRet => {
                    return res.status(400).send({
                        message: "Verification code is incorrect"
                    });
                });
            } else {
                updateVerifiedUser(user.Email).then(updateUserRet => {
                    if (!updateUserRet) {
                        return res.status(500).send({
                            message: "There was an issue activating your account, please try again later"
                        });
                    } else {
                        let username = user.dataValues.Username;
                        let email = user.dataValues.Email;
                        User.findAll({
                            where: {
                                [Op.and]: [
                                    { Username: username },
                                    { Active: false }
                                ]
                            }
                        }).then(users => {
                            for (i in users) {
                                userToRemove = users[i];
                                User.destroy({
                                    where: {
                                        UserId: userToRemove.UserId
                                    }
                                });
                            }
                        });
                        User.findAll({
                            where: {
                                [Op.and]: [
                                    { Email: email },
                                    { Active: false }
                                ]
                            }
                        }).then(users => {
                            for (x in users) {
                                userToRemove = users[i];
                                User.destroy({
                                    where: {
                                        Email: email
                                    }
                                });
                            }
                        });
                        let accessToken = jwt.sign(
                            { id: user.UserId },
                            authConfig.AUTH_SECRET,
                            { expiresIn: authConfig.JWT_EXPIRE_TIME }
                        );

                        createRefreshToken(user.Email).then(refreshToken => {
                            if (!refreshToken) {
                                return res.status(500).send({
                                    message: "Account activated, but there was an issue logging in, please try again"
                                });
                            } else {
                                res.cookie(appConfig.REFRESH_TOKEN, refreshToken, {
                                    httpOnly: true,
                                    signed: true
                                });

                                return res.status(200).send({
                                    username: user.Username,
                                    accessToken: accessToken
                                });
                            }
                        });
                    }
                });
            }
        }).catch(err => {
            logger.error(err.message);
            return res.status(500).send({
                message: "An error occured during verification. Please try again."
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
                    { Email: req.email },
                    { Active: false }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "Email entered was not found, or has already been activated"
                });
            } else {
                updateAndEmailCode(user.Email).then(updateAndEmailCodeRet => {
                    if (updateAndEmailCodeRet.status === 500) {
                        return res.status(500).send({
                            message: updateAndEmailCodeRet.message
                        });
                    } else {
                        return res.status(200).send({
                            message: "A new verification code has been sent to "
                                + user.Email
                        });
                    }
                });
            }
        }).catch(err => {
            logger.error(err.message);
            return res.status(500).send({
                message: "An error occured while resending verification code. Please try again."
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
                    { Username: req.username },
                    { Email: req.email }
                ],
                [Op.and]: [
                    { Active: true }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "User was not found"
                });
            } else {
                let validPassword = bcrypt.compareSync(
                    req.password,
                    user.Password
                );

                if (!validPassword) {
                    logger.warn("Invalid password entered for user " + req.username);
                    return res.status(401).send({
                        message: "Password was invalid"
                    });
                } else {
                    let accessToken = jwt.sign(
                        { id: user.UserId },
                        authConfig.AUTH_SECRET,
                        { expiresIn: authConfig.JWT_EXPIRE_TIME }
                    );

                    createRefreshToken(user.Email).then(refreshToken => {
                        if (!refreshToken) {
                            return res.status(500).send({
                                message: "There was an issue logging in, please try again"
                            });
                        } else {
                            res.cookie(appConfig.REFRESH_TOKEN, refreshToken, {
                                httpOnly: true,
                                signed: true
                            });

                            return res.status(200).send({
                                username: user.Username,
                                accessToken: accessToken
                            });
                        }
                    });
                }
            }
        }).catch(err => {
            logger.error(err.message);
            return res.status(500).send({
                message: "An error occurred during login. Please try again."
            });
        });
    }
};

function refreshTokenExpired(datetime) {
    let nowTime = moment();
    let expirationTime = moment(datetime);

    if (nowTime.isBefore(expirationTime)) {
        return false;
    }

    return true;
};

exports.refreshToken = (req, res) => {
    if (!req.refreshToken) {
        return res.status(200).send({
            message: false
        });
    } else {
        RefreshToken.findOne({
            where: {
                RefreshTokenId: req.refreshToken
            }
        }).then(tokenRow => {
            if (!tokenRow) {
                return res.status(404).send({
                    message: "Refresh token was not found"
                });
            } else {
                if (refreshTokenExpired(tokenRow.ExpirationDate)) {
                    return res.status(401).send({
                        message: "Session has expired"
                    });
                } else {
                    let accessToken = jwt.sign(
                        { id: tokenRow.RefreshTokenUserId },
                        authConfig.AUTH_SECRET,
                        { expiresIn: authConfig.JWT_EXPIRE_TIME }
                    );

                    updateRefreshToken(req.refreshToken).then(refreshToken => {
                        if (!refreshToken) {
                            return res.status(500).send({
                                message: "There was an issue renewing the session"
                            });
                        } else {
                            User.findOne({
                                where: {
                                    [Op.and]: [
                                        { UserId: tokenRow.RefreshTokenUserId },
                                        { Active: true }
                                    ]
                                }
                            }).then(user => {
                                if (!user) {
                                    return res.status(500).send({
                                        message: "There was an issue renewing the session"
                                    });
                                } else {
                                    res.cookie(appConfig.REFRESH_TOKEN, refreshToken, {
                                        httpOnly: true,
                                        signed: true
                                    });

                                    return res.status(200).send({
                                        username: user.Username,
                                        accessToken: accessToken
                                    });
                                }
                            }).catch(err => {
                                return res.status(500).send({
                                    message: "There was an issue renewing the session"
                                });
                            });
                        }
                    });
                }
            }
        }).catch(err => {
            logger.error(err.message);
            return res.status(500).send({
                message: "An error occurred while refreshing your session. Please log in again."
            });
        });
    }
};

exports.logout = (req, res) => {
    let token = req.refreshToken;
    res.clearCookie(appConfig.REFRESH_TOKEN);

    if (!token) {
        return res.status(200).send({
            message: "No refresh token"
        });
    } else {
        RefreshToken.destroy({
            where: {
                RefreshTokenId: token
            }
        }).then(empty => {
            return res.status(200).send({
                message: "Logout success"
            });
        }).catch(err => {
            logger.warn(err);
            return res.status(200).send({
                message: "Logout success"
            });
        });
    }
};

function updateResetPasswordCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        let newDateCreated =
            moment(Date.now()).format(appConfig.DB_DATE_FORMAT);

        let uuid = uuidv4();
        let newCode = uuid.substring(0, 8);

        User.update({
            ConfirmId: newCode,
            ConfirmIdDateCreated: newDateCreated,
            VerifyAttemptCount: 0
        },
            {
                where: {
                    [Op.and]: [
                        { Email: emailAddr },
                        { Active: true }
                    ]
                }
            }).then(user => {
                if (!user) {
                    logger.warn("User email: "
                        + emailAddr
                        + " not found and could not be updated");
                    resolve(false);
                } else {
                    resolve(newCode);
                }
            }).catch(err => {
                logger.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

function updateAndEmailResetPasswordCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        let ret = {
            status: 200,
            message: ""
        };

        updateResetPasswordCode(emailAddr).then(updateCode => {
            if (!updateCode) {
                ret.status = 500;
                ret.message = "There was an issue creating a reset password code, please try again later";
                resolve(ret);
            } else {
                email.sendResetPassword(
                    emailAddr,
                    updateCode
                ).then(emailSuccess => {
                    if (!emailSuccess) {
                        ret.status = 500;
                        ret.message = "There was an issue sending a reset password email, please try again later";
                        resolve(ret);
                    } else {
                        resolve(ret);
                    }
                });
            }
        });
    });
};

exports.resetPassword = (req, res) => {
    if (!req.email && !req.username) {
        return res.status(400).send({
            message: "Email or username is required"
        });
    } else {
        User.findOne({
            where: {
                [Op.or]: [
                    { Username: req.username },
                    { Email: req.email }
                ],
                [Op.and]: [
                    { Active: true }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "Email or username entered was not found, or the account has not been activated"
                });
            } else {
                updateAndEmailResetPasswordCode(user.Email).then(updateAndEmailCodeRet => {
                    if (updateAndEmailCodeRet.status === 500) {
                        return res.status(500).send({
                            message: updateAndEmailCodeRet.message
                        });
                    } else {
                        return res.status(200).send({
                            email: user.Email,
                            message: "A reset password code has been sent to "
                                + user.Email
                        });
                    }
                });
            }
        }).catch(err => {
            logger.error(err.message);
            return res.status(500).send({
                message: "An error occurred while resetting your password. Please try again."
            });
        });
    }
};

function updateResetCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        let newDateCreated =
            moment(Date.now()).format(appConfig.DB_DATE_FORMAT);

        let uuid = uuidv4();
        let newCode = uuid.substring(0, 8);

        User.update({
            ConfirmId: newCode,
            ConfirmIdDateCreated: newDateCreated,
            VerifyAttemptCount: 0
        },
            {
                where: {
                    [Op.and]: [
                        { Email: emailAddr },
                        { Active: true }
                    ]
                }
            }).then(user => {
                if (!user) {
                    logger.warn("User email: "
                        + emailAddr
                        + " not found and could not be updated");
                    resolve(false);
                } else {
                    resolve(newCode);
                }
            }).catch(err => {
                logger.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

function updateAndEmailResetCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        let ret = {
            status: 200,
            message: ""
        };

        updateResetCode(emailAddr).then(updateCode => {
            if (!updateCode) {
                ret.status = 500;
                ret.message = "There was an issue creating a new reset password code, please try again later";
                resolve(ret);
            } else {
                email.sendResetPassword(
                    emailAddr,
                    updateCode
                ).then(emailSuccess => {
                    if (!emailSuccess) {
                        ret.status = 500;
                        ret.message = "There was an issue sending a reset password email, please try again later";
                        resolve(ret);
                    } else {
                        resolve(ret);
                    }
                });
            }
        });
    });
};

function updateUserPassword(emailAddr, password) {
    return new Promise(function (resolve, reject) {
        let ret = {
            status: 200,
            message: ""
        };

        let salt = bcrypt.genSaltSync(10);
        let passwordHash = bcrypt.hashSync(password, salt);

        User.update({
            Password: passwordHash,
            ConfirmId: null,
            ConfirmIdDateCreated: null,
            VerifyAttemptCount: 0
        },
            {
                where: {
                    [Op.and]: [
                        { Email: emailAddr },
                        { Active: true }
                    ]
                }
            }).then(user => {
                if (!user) {
                    ret.status = 500;
                    ret.message = "There was an issue resetting your password, please try again later";
                    resolve(ret);
                } else {
                    resolve(ret);
                }
            }).catch(err => {
                logger.error(err.message);
                ret.status = 500;
                ret.message = "An error occured while updating your password. Please try again.";
                resolve(ret);
            });
    });
};

function addResetPasswordAttempt(emailAddr) {
    return new Promise(function (resolve, reject) {
        User.increment(
            "VerifyAttemptCount",
            {
                where: {
                    [Op.and]: [
                        { Email: emailAddr },
                        { Active: true }
                    ]
                }
            }).then(user => {
                if (!user) {
                    logger.warn("User email: "
                        + emailAddr
                        + " not found and could not be updated");
                    resolve(false);
                } else {
                    resolve(true);
                }
            }).catch(err => {
                logger.warn("User email: "
                    + emailAddr + ": " + err);
                resolve(false);
            });
    });
};

exports.confirmResetPassword = (req, res) => {
    if (!req.email || !req.confirmId || !req.password) {
        return res.status(400).send({
            message: "Email, reset password code, and a new password are required"
        });
    } else {
        User.findOne({
            where: {
                [Op.and]: [
                    { Email: req.email },
                    { Active: true }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "Email entered was not found, or the account has not been activated"
                });
            } else if (user.VerifyAttemptCount === 3) {
                updateAndEmailResetCode(user.Email).then(updateAndEmailResetCodeRet => {
                    if (updateAndEmailResetCodeRet.status === 500) {
                        return res.status(500).send({
                            message: "Maximum attempts reached<br />"
                                + updateAndEmailResetCodeRet.message
                        });
                    } else {
                        return res.status(400).send({
                            message: "Maximum attempts reached, a new reset password code has been sent to "
                                + user.Email
                        });
                    }
                });
            } else if (codeExpired(user.ConfirmIdDateCreated)) {
                updateAndEmailResetCode(user.Email).then(updateAndEmailResetCodeRet => {
                    if (updateAndEmailResetCodeRet.status === 500) {
                        return res.status(500).send({
                            message: "Reset password code has expired<br />"
                                + updateAndEmailResetCodeRet.message
                        });
                    } else {
                        return res.status(400).send({
                            message: "Reset password code has expired, a new code has been sent to "
                                + user.Email
                        });
                    }
                });
            } else if (user.ConfirmId != req.confirmId) {
                addResetPasswordAttempt(user.Email).then(addResetAttemptRet => {
                    return res.status(400).send({
                        message: "Reset password code is incorrect"
                    });
                });
            } else {
                updateUserPassword(user.Email, req.password).then(updateUserPasswordRet => {
                    if (updateUserPasswordRet.status === 500) {
                        return res.status(500).send({
                            message: updateUserPasswordRet.message
                        });
                    } else {
                        return res.status(200).send({
                            email: req.email,
                            message: "Your password has been reset successfully"
                        });
                    }
                });
            }
        }).catch(err => {
            logger.error(err.message);
            return res.status(500).send({
                message: "An error occurred. Please try again."
            });
        });
    }
};

exports.resendResetCode = (req, res) => {
    if (!req.email) {
        return res.status(400).send({
            message: "Email is required"
        });
    } else {
        User.findOne({
            where: {
                [Op.and]: [
                    { Email: req.email },
                    { Active: true }
                ]
            }
        }).then(user => {
            if (!user) {
                return res.status(404).send({
                    message: "Email entered was not found, or the account has not been activated"
                });
            } else {
                updateAndEmailResetCode(user.Email).then(updateAndEmailResetCodeRet => {
                    if (updateAndEmailResetCodeRet.status === 500) {
                        return res.status(500).send({
                            message: updateAndEmailResetCodeRet.message
                        });
                    } else {
                        return res.status(200).send({
                            message: "A new reset password code has been sent to "
                                + user.Email
                        });
                    }
                });
            }
        }).catch(err => {
            logger.error(err.message);
            return res.status(500).send({
                message: "An error occurred while resending your password reset code. Please try again."
            });
        });
    }
};