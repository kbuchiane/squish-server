const db = require("../models");
const authConfig = require("../config/auth.config");
const email = require("../utils/email");
const winston = require("winston");
const loggerServer = winston.loggers.get("squish-server");

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
    var dateCreated = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

    var userConfirmId = uuidv4();
    userConfirmId = userConfirmId.substring(0, 8);

    var salt = bcrypt.genSaltSync(10);
    var passwordHash = bcrypt.hashSync(req.body.auth.password, salt);

    User.create({
        username: req.body.auth.username,
        email: req.body.auth.email,
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

exports.confirmUser = (req, res) => {
    User.findOne({
        where: {
            [Op.and]: [
                { email: req.body.auth.email },
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
        } else if (user.user_confirm_id != req.body.auth.confirmId) {
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
                    var token = jwt.sign(
                        { id: user.user_id },
                        authConfig.AUTH_SECRET,
                        { expiresIn: 86400 } // 24 hours
                    );

                    return res.status(200).send({
                        username: user.username,
                        accessToken: token
                    });
                }
            });
        }
    }).catch(err => {
        return res.status(500).send({
            message: err.message
        });
    });
};

exports.resendCode = (req, res) => {
    User.findOne({
        where: {
            [Op.and]: [
                { email: req.body.auth.email },
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
};

exports.login = (req, res) => {
    User.findOne({
        where: {
            [Op.or]: [
                { username: req.body.auth.userId },
                { email: req.body.auth.userId }
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
                req.body.auth.password,
                user.password
            );

            if (!validPassword) {
                return res.status(401).send({
                    accessToken: null,
                    message: "Password was invalid"
                });
            } else {
                var token = jwt.sign(
                    { id: user.user_id },
                    authConfig.AUTH_SECRET,
                    { expiresIn: 86400 } // 24 hours
                );

                return res.status(200).send({
                    username: user.username,
                    accessToken: token
                });
            }
        }
    }).catch(err => {
        return res.status(500).send({
            message: err.message
        });
    });
};