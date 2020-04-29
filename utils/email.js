var nodemailer = require('nodemailer');

class Email {
    constructor() {
        // Empty
    };

    async sendConfirmation(email) {
        return new Promise(function(resolve, rejct) {
            var ret = {
                success: true,
                message: ""
            }

            resolve(ret);
        });
    }
}

module.exports = Email;