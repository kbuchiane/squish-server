var express = require('express');
var db = require('../utils/db');
var User = require('../models/user');

var router = express.Router();

/* GET call from client. */
router.get('/', function (req, res, next) {
    var username = req.query.username;
    var emailAddr = req.query.email;
    var password = req.query.password;

    // Check if user is valid and send confirmation email if so
    var user = new User();
    user.signup(username, emailAddr, password).then(function(ret) {
        console.log("sending final response: " + JSON.stringify(ret));

        res.send(ret);
    });
});

/*
router.get('/confirmUser', function (req, res, next) {
    
});
*/

module.exports = router;
