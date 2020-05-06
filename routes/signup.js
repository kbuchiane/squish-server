var express = require('express');
var User = require('../models/user');

var router = express.Router();

router.post('/', function (req, res, next) {
    var username = req.body.auth.username;
    var emailAddr = req.body.auth.email;
    var password = req.body.auth.password;

    var user = new User();
    user.signup(username, emailAddr, password).then(function (ret) {
        res.send(ret);
    });
});

router.post('/confirmUser', function (req, res, next) {
    var emailAddr = req.body.auth.email;
    var confirmId = req.body.auth.confirmId;

    var user = new User();
    user.confirmUser(emailAddr, confirmId).then(function (ret) {
        res.send(ret);
    })
});

router.post('/resendCode', function (req, res, next) {
    var emailAddr = req.body.auth.email;

    var user = new User();
    user.resendCode(emailAddr).then(function (ret) {
        res.send(ret);
    })
});

module.exports = router;
