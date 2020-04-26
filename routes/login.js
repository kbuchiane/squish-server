var express = require('express');
var router = express.Router();

/* GET call from client. */
router.get('/', function (req, res, next) {
    console.log('login username: ' + req.query.username);
    console.log('login password: ' + req.query.password);

    var response = {
        success: true,
        user: {
            username: req.query.username,
            email: ''
        }
    };

    res.send(response);
});

module.exports = router;
