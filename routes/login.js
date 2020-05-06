var express = require('express');
var User = require('../models/user');

var router = express.Router();

router.post('/', function (req, res, next) {
    var userId = req.body.auth.userId;
    var password = req.body.auth.password;

    var user = new User();
    user.login(userId, password).then(function (ret) {
        res.send(ret);
    });
});

module.exports = router;
