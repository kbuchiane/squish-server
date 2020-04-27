var Email = require('../utils/email');
var db = require('../utils/db');

class User {
    constructor() {
        // Empty
    };

    signup(username, emailAddr, password) {
        var ret = {
            success: false,
            message: ""
        };

        // Username, password, and email check
        if (username.length <= 0) {
            ret.message = "Please enter a username";
        } else if (this.usernameExists(username)) {
            ret.message = "An account already exists with that username";
        } else if (emailAddr.length <= 0) {
            ret.message = "Please enter an email";
        } else if (this.emailExists(emailAddr)) {
            ret.message = "An account already exists with that email"
        } else if (password.length <= 6) {
            ret.message = "Password must be more than 6 characters";
        } else {
            var createUserResponse = this.createNewUser(username, emailAddr, password);
            if (createUserResponse.success) {
                var email = new Email();
                var emailSent = email.sendConfirmation(emailAddr);

                if (!emailSent.success) {
                    ret.message = emailSent.error;
                } else {
                    ret.success = true;
                    ret.message = "A confirmation email has been sent to " + emailAddr +
                        ", please follow the link in the email to finish signing up";
                }
            } else {
                ret.message = createUserResponse.error;
            }
        }

        return ret;
    };

    usernameExists(username) {
        var exists = false;

        var sql = "SELECT username FROM users";

        return exists;
    };

    emailExists(email) {
        var exists = false;

        // Query for email

        return exists;
    };

    createNewUser(username, email, password) {
        var ret = {
            success: true,
            error: ""
        };

        // Create new non-active user

        return ret;
    };
}

module.exports = User;