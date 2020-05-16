checkEntries = (req, res, next) => {
    var username = req.body.auth.username;
    var emailAddr = req.body.auth.email;
    var password = req.body.auth.password;
    var confirmId = req.body.auth.confirmId;
    var userId = req.body.auth.userId;

    if (username) {
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
    }

    if (emailAddr) {
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
    }

    if (password) {
        if (password.length <= 6) {
            return res.status(400).send({
                message: "Password must be more than 6 characters"
            });
        }
    }

    if (confirmId) {
        if (confirmId.length != 8) {
            return res.status(400).send({
                message: "Verification code must be 8 characters"
            });
        }
    }

    if (userId) {
        if (userId.length <= 0) {
            return res.status(400).send({
                message: "Please enter an email or username"
            });
        } else if (/\s/.test(userId)) {
            return res.status(400).send({
                message: "Email or username can not include spaces"
            });
        } else if (userId.length > 255) {
            return res.status(400).send({
                message: "Email or username can not exceed 255 characters"
            });
        }
    }

    next();
};

const verifyCredentials = {
    checkEntries: checkEntries
};

module.exports = verifyCredentials;