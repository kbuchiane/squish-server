var express = require('express');
var User = require('../models/user');

var router = express.Router();

router.get('/', function (req, res, next) {
    var userId = req.query.userId;
    var password = req.query.password;

    var user = new User();
    user.login(userId, password).then(function (ret) {
        res.send(ret);
    });
});

module.exports = router;
