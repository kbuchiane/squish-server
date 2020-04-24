var express = require('express');
var router = express.Router();

/* GET call from client. */
router.get('/', function (req, res, next) {
    console.log('signup username: ' + req.query.username);
    console.log('signup email: ' + req.query.email);
    console.log('signup password: ' + req.query.password);

    var response = {
        success: true,
        userData: {
            username: req.query.username,
            email: req.query.email
        }
    };

    res.send(response);
});

module.exports = router;
