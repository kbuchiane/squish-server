var express = require('express');
var db = require('../utils/db');
var User = require('../models/user');

var router = express.Router();

router.get('/', function (req, res, next) {
    var username = req.query.username;
    var emailAddr = req.query.email;
    var password = req.query.password;

    var user = new User();
    user.signup(username, emailAddr, password).then(function (ret) {
        res.send(ret);
    });
});

router.get('/confirmUser', function (req, res, next) {
    var confirmId = req.query.confirmId;

    var user = new User();
    user.confirmUser(confirmId).then(function (ret) {
        res.send(ret);
    })
});

module.exports = router;
