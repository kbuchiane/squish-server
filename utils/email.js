var nodemailer = require('nodemailer');

class Email {
    constructor() {
        // Empty
    };

    async sendConfirmation(emailAddr, confirmId) {
        var ret = {
            success: true,
            message: ""
        }

        /*
        var transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                type: "OAuth2",
                user: process.env.confirm_email_host
            }
        });

        transporter.set("oauth2_provision_cb", (user, renew, callback) => {
            var accessToken = userTokens[user];
            if (!accessToken) {
                ret.success = false;
                message = "Unable to send confirmation email, please try again later";
                return callback(new Error("Unknown user"));
            } else {
                return callback(null, accessToken);
            }
        });

        console.log("sending email to: " + emailAddr);
        console.log("sending email from: " + process.env.confirm_email_host);
        console.log("email pass: " + process.env.confirm_email_pass);

        var info = await transporter.sendMail({
            from: "Squish <" + process.env.confirm_email_host + ">",
            to: emailAddr,
            subject: "Squish Email Confirmation",
            html: "<b>Click link below to confirm email account</b>"
                + "<a href='" + process.env.squish_client_url + "'></a>"
        });

        console.log("confirm email info: " + JSON.stringify(info));
        */

        ret.success = false;
        ret.message = "test fail email confirm";

        return ret;
    };
}

module.exports = Email;