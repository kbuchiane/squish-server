checkEntries = (req, res, next) => {
    var username = req.body.auth.username;
    var usernameRequired = req.body.auth.usernameRequired;

    var emailAddr = req.body.auth.email;
    var emailRequired = req.body.auth.emailRequired;

    var password = req.body.auth.password;
    var passwordRequired = req.body.auth.passwordRequired;

    if (usernameRequired) {
        if (username.length <= 0) {
            return res.status(400).send({
                message: "Please enter a username"
            });
        } else if (/\s/.test(username)) {
            return res.status(400).send({
                message: "Username can not include spaces"
            });
        } else if (!(/^[a-z0-9]+$/i.test(username))) {
            return res.status(400).send({
                message: "Username can not include special characters"
            });
        } else if (username.length > 45) {
            return res.status(400).send({
                message: "Username can not exceed 45 characters"
            });
        }
    } else if (emailRequired) {
        if (emailAddr.length <= 0) {
            return res.status(400).send({
                message: "Please enter an email"
            });
        } else if (/\s/.test(emailAddr)) {
            return res.status(400).send({
                message: "Email can not include spaces"
            });
        } else if (emailAddr.length > 255) {
            return res.status(400).send({
                message: "Email can not exceed 255 characters"
            });
        }
    } else if (passwordRequired) {
        if (password.length <= 6) {
            return res.status(400).send({
                message: "Password must be more than 6 characters"
            });
        }
    }

    next();
};

const verifyCredentials = {
    checkEntries: checkEntries
};

module.exports = verifyCredentials;