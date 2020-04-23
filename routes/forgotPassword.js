var express = require('express');
var router = express.Router();

/* GET call from client. */
router.get('/', function(req, res, next) {
    console.log('forgot password: ' + req.query.userIdForgot);

    var response = {
        success: true,
        emailForgot: 'user ID: ' + req.query.userIdForgot
    };

    res.send(response);
});

module.exports = router;
