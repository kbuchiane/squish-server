var express = require('express');
var db = require('../utils/db');
var User = require('../models/user');

var router = express.Router();

/* GET call from client. */
router.get('/', function (req, res, next) {
    var username = req.query.username;
    var emailAddr = req.query.email;
    var password = req.query.password;

    console.log(username);

    // Check if user is valid and send confirmation email if so
    var user = new User();
    var ret = user.signup(username, emailAddr, password);

    res.send(ret);
});

/*
router.get('/confirmUser', function (req, res, next) {
    
});
*/

module.exports = router;
