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

        async function createUser(username, emailAddr, password) {
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

                    resolve(createUserRet);
                });
            });
        };

        // Processes
        var ret = {
            success: true,
            message: ""
        };

        var checkStringRet = await checkStringEntries(username, emailAddr, password);
        
        console.log("checkStringRet: " + JSON.stringify(checkStringRet));

        if (!checkStringRet.success) {
            return checkStringRet;
        }

        var createUserRet = await createUser(username, emailAddr, password);
        
        console.log("createUserRet: " + JSON.stringify(createUserRet));
        
        if (!createUserRet.success) {
            return createUserRet;
        }

        var email = new Email();
        var emailConfirmRet = await email.sendConfirmation(emailAddr);

        console.log("emailConfirmRet: " + JSON.stringify(emailConfirmRet));

        if (!emailConfirmRet.success) {
            return emailConfirmRet;
        } else {
            ret.message = "A confirmation email has been sent to "
                + emailAddr +
                ", please follow the link in the email to finish signing up";
                return ret;
        }
    };
}

module.exports = User;