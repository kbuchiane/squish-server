const db = require("../models");
const authConfig = require("../config/auth.config");
const Email = require("../utils/email");
const loggerServer = winston.loggers.get("squish-server");

const user = db.user;
const op = db.Sequelize.Op;

const { v4: uuidv4 } = require("uuid");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var moment = require("moment");

async function deleteNewUser(username) {
    return new Promise(function (resolve, reject) {
        user.destroy({
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

    user.create({
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
        // Send confirmation email
        var email = new Email();
        var emailSuccess = await email.sendConfirmation(
            user.email,
            user.user_confirm_id
        );

        if (!emailSuccess) {
            // Delete user
            var deleteSuccess = await deleteNewUser(user.username);
            if (!deleteSuccess) {
                return res.status(500).send({
                    message: "A rare error occurred (whoops), you may have to try again later using a different username/email or please contact customer service for assistance"
                });
            }

            return res.status(500).send({
                message: "There was an issue sending a confirmation email, please try again later"
            })
        }

        res.status(200).send({
            message: "A verification code has been sent to "
                + user.email
        });
    }).catch(err => {
        res.status(500).send({
            message: err.message
        });
    });
};

function codeExpired(datetime) {
    var nowTime = moment();
    var codeTime = moment(datetime);
    var minuteDiff = nowTime.diff(codeTime, 'minutes');
    var maxMinutes = 4;

    if (minuteDiff < maxMinutes) {
        return false;
    }

    return true;
};

async function updateVerificationCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        var newDateCreated =
            moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

        var uuid = uuidv4();
        var newCode = uuid.substring(0, 8);

        user.update({
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
                if (err) {
                    loggerServer.warn("User email: "
                        + emailAddr + ": " + err);
                    resolve(false);
                }
            });

        resolve(newCode);
    });
};

async function updateAndEmailCode(emailAddr) {
    return new Promise(function (resolve, reject) {
        var ret = {
            status: 200,
            message: ""
        };

        var updateCode = await updateVerificationCode(emailAddr);
        if (!updateCode) {
            ret.status = 500;
            ret.message = "There was an issue creating a new verification code, please try again later";
        } else {
            var email = new Email();
            var emailSuccess = await email.sendConfirmation(
                emailAddr,
                updateCode
            );

            if (!emailSuccess) {
                ret.status = 500;
                ret.message = "There was an issue sending a confirmation email, please try again later";
            }
        }

        resolve(ret);
    });
};

async function addVerifyAttempt(emailAddr) {
    return new Promise(function (resolve, reject) {
        user.update({
            verify_attempt_count: verify_attempt_count + 1
        },
            {
                where: {
                    [Op.and]: [
                        { email: emailAddr },
                        { active: false }
                    ]
                }
            }).then(user => {
                if (err) {
                    loggerServer.warn("User email: "
                        + emailAddr + ": " + err);
                }
            });

        resolve(true);
    });
};

exports.confirmUser = (req, res) => {
    user.findOne({
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
        } else if (user.verify_attempt_count == 3) {
            var updateAndEmailCodeRet =
                await updateAndEmailCode(user.email);

            if (updateAndEmailCodeRet.status === 500) {
                return res.status(500).send({
                    message: "Maximum attempts reached<br />"
                        + updateAndEmailCodeRet.message
                });
            }

            return res.status(400).send({
                message: "Maximum attempts reached, a new verification code has been sent to "
                    + user.email
            });
        } else if (codeExpired(user.confirm_id_date_created)) {
            var updateAndEmailCodeRet =
                await updateAndEmailCode(user.email);

            if (updateAndEmailCodeRet.status === 500) {
                return res.status(500).send({
                    message: "Verification code has expired<br />"
                        + updateAndEmailCodeRet.message
                });
            }

            return res.status(400).send({
                message: "Verification code has expired, a new code has been sent to "
                    + user.email
            });
        } else if (user.user_confirm_id != req.body.auth.confirmId) {
            await addVerifyAttempt(user.email);

            return res.status(400).send({
                message: "Verification code is incorrect"
            });
        }

        var token = jwt.sign(
            { id: user.user_id },
            authConfig.AUTH_SECRET,
            { expiresIn: 86400 } // 24 hours
        );

        res.status(200).send({
            username: user.username,
            accessToken: token
        });
    }).catch(err => {
        res.status(500).send({
            message: err.message
        });
    });
};

exports.resendCode = (req, res) => {
    user.findOne({
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
        }

        var updateAndEmailCodeRet =
            await updateAndEmailCode(user.email);

        if (updateAndEmailCodeRet.status === 500) {
            return res.status(500).send({
                message: updateAndEmailCodeRet.message
            });
        }

        res.status(200).send({
            message: "A verification code has been sent to "
                + user.email
        });
    }).catch(err => {
        res.status(500).send({
            message: err.message
        });
    });
};

exports.login = (req, res) => {
    user.findOne({
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
        }

        var validPassword = bcrypt.compareSync(
            req.body.auth.password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).send({
                accessToken: null,
                message: "Password was invalid"
            });
        }

        var token = jwt.sign(
            { id: user.user_id },
            authConfig.AUTH_SECRET,
            { expiresIn: 86400 } // 24 hours
        );

        res.status(200).send({
            username: user.username,
            accessToken: token
        });
    }).catch(err => {
        res.status(500).send({
            message: err.message
        });
    });
};