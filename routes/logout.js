const winston = require('winston');
const logger1 = winston.loggers.get('squish-server');
const logger2 = winston.loggers.get('squish-console');

var express = require('express');
var router = express.Router();

router.post('/', function (req, res, next) {
    logger1.info('User ' + req.body.auth.username + ' logged out');
    logger2.info('User ' + req.body.auth.username + ' logged out');

    var response = {
        success: true
    };

    res.send(response);
});

module.exports = router;