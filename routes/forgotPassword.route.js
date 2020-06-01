var express = require("express");
var router = express.Router();

router.post("/", function (req, res, next) {
    console.log("forgot password: " + req.body.auth.userIdForgot);

    var response = {
        success: true,
        emailForgot: req.query.userIdForgot
    };

    res.send(response);
});

module.exports = router;
