var Email = require('../utils/email');
var db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

class User {
    constructor() {
        // Empty
    };

    async signup(username, emailAddr, password) {
        // Functions
        async function checkStringEntries(username, emailAddr, password) {
            return new Promise(function (resolve, reject) {
                var checkStringRet = {
                    success: true,
                    message: ""
                };

                if (username.length <= 0) { // Username length
                    checkStringRet.success = false;
                    checkStringRet.message = "Please enter a username";
                } else if (/\s/.test(username)) { // Username spaces
                    checkStringRet.success = false;
                    checkStringRet.message = "Username can not include spaces";
                } else if (emailAddr.length <= 0) { // Email length
                    checkStringRet.success = false;
                    checkStringRet.message = "Please enter an email";
                } else if (/\s/.test(emailAddr)) { // Email spaces
                    checkStringRet.success = false;
                    checkStringRet.message = "Email can not include spaces"
                } else if (password.length <= 6) { // Password length
                    checkStringRet.success = false;
                    checkStringRet.message = "Password must be more than 6 characters";
                }

                resolve(checkStringRet);
            });
        };

        async function createUser(username, emailAddr, password) {
            return new Promise(function (resolve, rejct) {
                var createUserRet = {
                    success: true,
                    message: "",
                    confirmId: ""
                };

                var sql = "INSERT INTO user (user_id, username, email, password, date_created, active, user_confirm_id, confirm_id_date_created, verify_attempt_count, admin) VALUES (?)";
                var dateCreated = new Date().toISOString()
                    .slice(0, 19).replace("T", " ");

                var userConfirmId = uuidv4();
                userConfirmId = userConfirmId.substring(0, 8);

                var values = [
                    null,
                    username,
                    emailAddr,
                    password,
                    dateCreated,
                    false,
                    userConfirmId,
                    dateCreated,
                    0,
                    false
                ];

                db.query(sql, [values], function (err, result) {
                    if (err) {
                        createUserRet.success = false;
                        var unkError = "An error occurred while creating a new user, please try again later";
                        if (err.errno === 1062) {
                            if (err.sqlMessage === "Duplicate entry '"
                                + username + "' for key 'user.username_UNIQUE'") {
                                createUserRet.message = "An account already exists with that username";
                            } else if (err.sqlMessage === "Duplicate entry '"
                                + emailAddr + "' for key 'user.email_UNIQUE'") {
                                createUserRet.message = "An account already exists with that email";
                            } else {
                                createUserRet.message = unkError;
                            }
                        } else {
                            createUserRet.message = unkError;
                        }
                    }

                    createUserRet.confirmId = userConfirmId;
                    resolve(createUserRet);
                });
            });
        };

        async function deleteNewUser(username) {
            return new Promise(function (resolve, rejct) {
                var deleteUserRet = {
                    success: true,
                    message: ""
                };

                var sql = "DELETE FROM user WHERE username = ?";
                db.query(sql, username, function (err, result) {
                    if (err) {
                        deleteUserRet.success = false;
                        var whoopsError = "A rare error occurred (whoops), you may have to try again later using a different username/email or please contact customer service for assistance";
                        deleteUserRet.message = whoopsError;
                    }

                    resolve(deleteUserRet);
                });
            });
        };

        // Processes
        var ret = {
            success: true,
            message: ""
        };

        var checkStringRet = await checkStringEntries(username, emailAddr, password);
        if (!checkStringRet.success) {
            return checkStringRet;
        }

        var createUserRet = await createUser(username, emailAddr, password);
        if (!createUserRet.success) {
            ret.success = false;
            ret.message = createUserRet.message;
            return ret;
        }

        var email = new Email();
        var emailConfirmRet = await email.sendConfirmation(emailAddr, createUserRet.confirmId);
        if (!emailConfirmRet.success) {
            var deleteUserRet = await deleteNewUser(username);
            if (!deleteUserRet.success) {
                return deleteUserRet;
            }

            return emailConfirmRet;
        } else {
            ret.message = "A confirmation email has been sent to "
                + emailAddr +
                ", please enter the verification code to finish signing up";
            return ret;
        }
    };

    async confirmUser(emailAddr, confirmId) {
        // Functions
        async function checkStringEntries(emailAddr, confirmId) {
            return new Promise(function (resolve, reject) {
                var checkStringRet = {
                    success: true,
                    message: ""
                };

                if (emailAddr.length <= 0) { // Email length
                    checkStringRet.success = false;
                    checkStringRet.message = "Please enter an email";
                } else if (/\s/.test(emailAddr)) { // Email spaces
                    checkStringRet.success = false;
                    checkStringRet.message = "Email can not include spaces"
                } else if (confirmId.length != 8) {
                    checkStringRet.success = false;
                    checkStringRet.message = "Verification code should be 8 characters";
                }

                resolve(checkStringRet);
            });
        };

        function codeExpired(datetime) {
            var nowTime = new Date().getTime();
            var codeTime = new Date(datetime).getTime();

            if (!isNaN(codeTime)) {
                var milliDiff = nowTime - codeTime;
                var dateDiff = new Date(milliDiff);
                var minutesDiff = dateDiff.getMinutes();
                var maxMinutes = 4;

                if (minutesDiff < maxMinutes) {
                    return false;
                }
            }

            return true;
        };

        async function updateVerificationCode(emailAddr) {
            return new Promise(function (resolve, reject) {
                var updateCodeRet = {
                    success: true,
                    message: ""
                };

                // Generate new code
                var newDateCreated = new Date().toISOString()
                    .slice(0, 19).replace("T", " ");

                var newUserConfirmId = uuidv4();
                newUserConfirmId = newUserConfirmId.substring(0, 8);

                // Upate db code
                var sql = "UPDATE user SET user_confirm_id = ?, confirm_id_date_created = '" + newDateCreated + "', verify_attempt_count = 0 WHERE email = '" + emailAddr + "'";
                db.query(sql, newUserConfirmId, function (err, result) {
                    if (err) {
                        updateCodeRet.success = false;
                        updateCodeRet.message = "There was an issue sending a new verification code, please try again later";
                    } else {
                        updateCodeRet.message = newUserConfirmId;
                    }

                    resolve(updateCodeRet);
                });
            });
        };

        async function addVerifyAttempt(emailAddr) {
            return new Promise(function (resolve, rejct) {
                var addVerifyAttemptRet = {
                    success: true,
                    message: ""
                };

                var sql = "UPDATE user SET verify_attempt_count = verify_attempt_count + 1 WHERE email = ?";
                db.query(sql, emailAddr, function (err, result) {
                    if (err) {
                        addVerifyAttemptRet.success = false;
                        addVerifyAttemptRet.message = "There was an issue verifying your account, please try again later";
                    }

                    resolve(addVerifyAttemptRet);
                });
            });
        };

        async function verifyUser(emailAddr, confirmId) {
            return new Promise(function (resolve, rejct) {
                var verifyUserRet = {
                    success: true,
                    message: "",
                    resendCode: false,
                    incrementAttempt: false,
                    username: ""
                };

                var sql = "SELECT * FROM user WHERE email = ? AND active = false";
                db.query(sql, emailAddr, function (err, result) {
                    if (err) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "There was an issue verifying your account, please try again later";
                    }

                    if (result.length === 0) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "Email entered was not found, or has already been verified";
                    } else if (result[0].verify_attempt_count == 3) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "Maximum attempts reached, a new verification code has been sent to " + emailAddr;
                        verifyUserRet.resendCode = true;
                    } else if (codeExpired(result[0].confirm_id_date_created)) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "Verification code has expired, a new code has been sent to " + emailAddr;
                        verifyUserRet.resendCode = true;
                    } else if (result[0].user_confirm_id != confirmId) {
                        verifyUserRet.success = false;
                        verifyUserRet.message = "Entered verification code is incorrect";
                        verifyUserRet.incrementAttempt = true;
                    } else {
                        verifyUserRet.username = result[0].username;
                    }

                    resolve(verifyUserRet);
                });
            });
        };

        async function updateVerifiedUser(emailAddr) {
            return new Promise(function (resolve, rejct) {
                var updateVerifiedUserRet = {
                    success: true,
                    message: ""
                };

                var sql = "UPDATE user SET user_confirm_id = null, confirm_id_date_created = null, verify_attempt_count = 0, active = true WHERE email = ?";
                db.query(sql, emailAddr, function (err, result) {
                    if (err) {
                        updateVerifiedUserRet.success = false;
                        updateVerifiedUserRet.message = "There was an issue verifying your account, please try again later";
                    }

                    resolve(updateVerifiedUserRet);
                });
            });
        };

        // Processes
        var ret = {
            success: true,
            message: "",
            username: ""
        };

        var checkStringRet = await checkStringEntries(emailAddr, confirmId);
        if (!checkStringRet.success) {
            return checkStringRet;
        }

        var verifyUserRet = await verifyUser(emailAddr, confirmId);
        if (!verifyUserRet.success) {
            if (verifyUserRet.resendCode) {
                var updateCodeRet = await updateVerificationCode(emailAddr);

                if (updateCodeRet.success) {
                    var email = new Email();
                    await email.sendConfirmation(emailAddr, updateCodeRet.message);
                }
            } else if (verifyUserRet.incrementAttempt) {
                await addVerifyAttempt(emailAddr);
            }

            ret.success = false;
            ret.message = verifyUserRet.message;
            return ret;
        } else {
            var updateVerifiedUserRet = await updateVerifiedUser(emailAddr);
            updateVerifiedUserRet.message = verifyUserRet.username;

            return updateVerifiedUserRet;
        }
    };

    async resendCode(emailAddr) {
        // Functions
        async function checkStringEntries(emailAddr) {
            return new Promise(function (resolve, reject) {
                var checkStringRet = {
                    success: true,
                    message: ""
                };

                if (emailAddr.length <= 0) { // Email length
                    checkStringRet.success = false;
                    checkStringRet.message = "Please enter an email";
                } else if (/\s/.test(emailAddr)) { // Email spaces
                    checkStringRet.success = false;
                    checkStringRet.message = "Email can not include spaces"
                }

                resolve(checkStringRet);
            });
        };

        async function updateVerificationCode(emailAddr) {
            return new Promise(function (resolve, reject) {
                var updateCodeRet = {
                    success: true,
                    message: ""
                };

                // Generate new code
                var newDateCreated = new Date().toISOString()
                    .slice(0, 19).replace("T", " ");

                var newUserConfirmId = uuidv4();
                newUserConfirmId = newUserConfirmId.substring(0, 8);

                // Upate db code
                var sql = "UPDATE user SET user_confirm_id = ?, confirm_id_date_created = '"
                    + newDateCreated
                    + "', verify_attempt_count = 0 WHERE email = '"
                    + emailAddr + "' AND active = false";
                db.query(sql, newUserConfirmId, function (err, result) {
                    if (err) {
                        updateCodeRet.success = false;
                        updateCodeRet.message = "There was an issue sending a new verification code, please try again later";
                    } else if (result.affectedRows === 0) {
                        updateCodeRet.success = false;
                        updateCodeRet.message = "Email entered was not found, or has already been verified";
                    } else {
                        updateCodeRet.message = newUserConfirmId;
                    }

                    resolve(updateCodeRet);
                });
            });
        };

        // Processes
        var ret = {
            success: true,
            message: ""
        };

        var checkStringRet = await checkStringEntries(emailAddr);
        if (!checkStringRet.success) {
            return checkStringRet;
        }

        var updateCodeRet = await updateVerificationCode(emailAddr);

        if (!updateCodeRet.success) {
            return updateCodeRet;
        }

        var email = new Email();
        var emailConfirmRet = await email.sendConfirmation(emailAddr, updateCodeRet.message);
        if (!emailConfirmRet.success) {
            return emailConfirmRet;
        } else {
            ret.message = "A confirmation email has been sent to "
                + emailAddr +
                ", please enter the verification code to finish signing up";
            return ret;
        }
    };
}

module.exports = User;