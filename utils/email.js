var nodemailer = require("nodemailer");
var appConfig = require("../config/app.config");

class Email {
    constructor() {
        // Empty
    };

    async sendConfirmation(emailAddr, confirmId) {
        return new Promise(function (resolve, reject) {
            var transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.confirm_email_host,
                    pass: process.env.confirm_email_pass
                }
            });

            var mailOptions = {
                from: process.env.confirm_email_host,
                to: emailAddr,
                subject: "Squish Sign Up Confirmation",
                html: "<b style='font-weight:700'>Verification Code (expires in 4 minutes): "
                    + confirmId
                    + "<br><br><a href='"
                    + appConfig.VERIFY_EMAIL_URL
                    + "'>Verify Email</a></b>"
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    resolve(false);
                }

                resolve(true);
            });
        });
    };
}

module.exports = Email;