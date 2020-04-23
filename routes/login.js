var express = require('express');
var router = express.Router();

/* GET call from client. */
router.get('/', function(req, res, next) {
    console.log('login username: ' + req.query.username);
    console.log('login password: ' + req.query.password);
    res.send(req.query.username + ' logged in');
});

module.exports = router;
