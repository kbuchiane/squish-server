var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    console.log('logout username: ' + req.query.username);

    var response = {
        success: true
    };

    res.send(response);
});

module.exports = router;
