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

        async function verifyUser(emailAddr, confirmId) {
            return new Promise(function (resolve, rejct) {
                var verifyUserRet = {
                    success: true,
                    message: ""
                };

                var sql = "SELECT * FROM user WHERE email = ? AND active = false";

                db.query(sql, emailAddr, function (err, result) {
                    if (err) {
                        console.log(err);
                        verifyUserRet.success = false;
                        verifyUserRet.message = "There was an issue verifying your account, please try again later";
                    }

                    console.log("verifyUser result: " + JSON.stringify(result));

                    // if nothing, error

                    // if verify attempts = 3, error, send new code, set attempts back to 0

                    // if confirmId does not equal db value, error

                    // if confirmId time created older than 4 min, error, send new code

                    // if success, call function to set active to true and clear confirmId fields

                    resolve(verifyUserRet);
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
                    } else {
                        // set message to username
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

        console.log("checkStringRet: " + JSON.stringify(checkStringRet));

        if (!checkStringRet.success) {
            return checkStringRet;
        }

        var verifyUserRet = await verifyUser(emailAddr, confirmId);

        console.log("verifyUserRet: " + JSON.stringify(verifyUserRet));

        if (!verifyUserRet.success) {
            var addVerifyAttemptRet = await addVerifyAttempt(emailAddr);

            ret.success = false;
            ret.message = verifyUserRet.message;
            return ret;
        }

        var updateVerifiedUserRet = await updateVerifiedUser(emailAddr);

        console.log("updateVerifiedUserRet: " + JSON.stringify(updateVerifiedUserRet));

        return updateVerifiedUserRet;
    };
}

module.exports = User;