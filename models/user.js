var Email = require('../utils/email');
var db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

class User {
    constructor() {
        // Empty
    };

    signup(username, emailAddr, password) {
        return new Promise(function(resolve, reject) {
            var ret = {
                success: true,
                message: ""
            };

            var email = new Email();

            // Functions
            function checkStringEntries(username, emailAddr, password) {
                return new Promise(function(resolve, reject) {
                    console.log("checking string entries");

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

            function checkUsernameExists(username) {
                return new Promise(function(resolve, reject) {
                    console.log("checking username duplicate");

                    var checkUsernameRet = {
                        success: true,
                        exists: false,
                        error: ""
                    }
            
                    var sql = "SELECT username FROM user WHERE username = ?";
                    db.query(sql, [username], function (err, result) {
                        if (err) {
                            console.log(err);
                            checkUsernameRet.success = false;
                            checkUsernameRet.error = "An error occurred while checking for duplicate usernames, please try again later";
                        } else if (result.length > 0) {
                            checkUsernameRet.exists = true;
                        }

                        resolve(checkUsernameRet);
                    });
                });
            };

            function checkEmailExists(emailAddr) {
                return new Promise(function(resolve, reject) {
                    console.log("checking email duplicate");

                    var checkEmailRet = {
                        success: true,
                        exists: false,
                        error: ""
                    }
            
                    var sql = "SELECT email FROM user WHERE email = ?";
                    db.query(sql, [emailAddr], function (err, result) {
                        if (err) {
                            console.log(err);
                            checkEmailRet.success = false;
                            checkEmailRet.error = "An error occurred while checking for duplicate emails, please try again later";
                        } else if (result.length > 0) {
                            checkEmailRet.exists = true;
                        }
                    });
            
                    resolve(checkEmailRet);
                });
            };

            function createUser(username, emailAddr, password) {
                return new Promise(function(resolve, rejct) {
                    console.log("creating new user");

                    var createUserRet = {
                        success: true,
                        message: ""
                    };
            
                    var sql = "INSERT INTO user (user_id, username, email, password, date_created, active, user_confirm_id, admin) VALUES (?)";
                    var dateCreated = new Date().toISOString()
                        .slice(0, 19).replace("T", " ");
                    var userConfirmId = uuidv4();
                    var values = [
                        null,
                        username,
                        emailAddr,
                        password,
                        dateCreated,
                        false,
                        userConfirmId,
                        false
                    ];
            
                    db.query(sql, [values], function (err, result) {
                        if (err) {
                            console.log(err);
                            createUserRet.success = false;
                            createUserRet.message = "An error occurred while creating a new user, please try again later";
                        }
                    });
            
                    resolve(createUserRet);
                });
            };

            // Processes
            checkStringEntries(username, emailAddr, password).then(function(checkStringRet) {
                if (!checkStringRet.success) {
                    resolve(checkStringRet);
                }
            }).then(checkUsernameExists(username).then(function(checkUsernameRet) {
                if (!checkUsernameRet.success) {
                    ret.success = false;
                    ret.message = checkUsernameRet.error;
                    resolve(ret);
                } else if (checkUsernameRet.exists) {
                    ret.success = false;
                    ret.message = "An account already exists with that username";
                    resolve(ret);
                }
            })).then(checkEmailExists(emailAddr).then(function(checkEmailRet) {
                if (!checkEmailRet.success) {
                    ret.success = false;
                    ret.message = checkEmailRet.error;
                    resolve(ret);
                } else if (checkEmailRet.exists) {
                    ret.success = false;
                    ret.message = "An account already exists with that email";
                    resolve(ret);
                }
            })).then(createUser(username, emailAddr, password).then(function(createUserRet) {
                if (!createUserRet.success) {
                    ret.success = false;
                    ret.message = createUserRet.message;
                    resolve(ret);
                }
            })).then(email.sendConfirmation(emailAddr).then(function(emailConfirmRet) {
                if (!emailConfirmRet.success) {
                    resolve(emailConfirmRet);
                } else {
                    ret.message = "A confirmation email has been sent to "
                        + emailAddr +
                        ", please follow the link in the email to finish signing up";
                    resolve(ret);
                }
            }));
        });
    };
}

module.exports = User;