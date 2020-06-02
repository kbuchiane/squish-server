const nodemailer = require("nodemailer");
const appConfig = require("../config/app.config");
const authConfig = require("../config/auth.config");

exports.sendConfirmation = (emailAddr, confirmId) => {
    return new Promise(function (resolve, reject) {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: authConfig.EMAIL_HOST,
                pass: authConfig.EMAIL_PASS
            }
        });

        let mailOptions = {
            from: authConfig.EMAIL_HOST,
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