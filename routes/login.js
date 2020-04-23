var express = require('express');
var router = express.Router();

/* GET call from client. */
router.get('/', function(req, res, next) {
    console.log('login endpoint hit: ' + JSON.stringify(req));
    res.send('response');
});

module.exports = router;
