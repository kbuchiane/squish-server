
const winston = require('winston');

//
// Grab your preconfigured loggers
//
const logger1 = winston.loggers.get('squish-server');
const logger2 = winston.loggers.get('squish-console');


var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    logger1.info('User ' + req.query.username + ' logged in');
    logger2.info('User ' + req.query.username + ' logged in');
   
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
