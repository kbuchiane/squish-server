var nodemailer = require('nodemailer');

class Email {
    constructor() {
        // Empty
    };

    async sendConfirmation(emailAddr, confirmId) {
        return new Promise(function (resolve, rejct) {
            var ret = {
                success: true,
                message: ""
            }

            var transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.confirm_email_host,
                    pass: process.env.confirm_email_pass
                }
            });

            var confirmUrl = process.env.squish_server_url
                + "signup/confirmUser?confirmId="
                + confirmId;

            var mailOptions = {
                from: process.env.confirm_email_host,
                to: emailAddr,
                subject: "Squish Sign Up Confirmation",
                html: "<a style='font-weight: 700' href='"
                    + confirmUrl
                    + "'>Please click here to confirm your email account</a>"
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    ret.success = false;
                    ret.message = "There was an issue sending a confirmation email, please try again later";
                }

                resolve(ret);
            });
        });
    };
}

module.exports = Email;