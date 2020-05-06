var express = require('express');
var router = express.Router();

router.post('/', function (req, res, next) {
    console.log('logout username: ' + req.body.auth.username);

    var response = {
        success: true
    };

    res.send(response);
});

module.exports = router;
