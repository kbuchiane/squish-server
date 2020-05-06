const winston = require('winston');

//
// Grab your preconfigured loggers
//
const logger1 = winston.loggers.get('squish-server');
const logger2 = winston.loggers.get('squish-console');



var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
   // console.log('logout username: ' + req.query.username);

   logger1.info('User ' + req.query.username + ' logged out');
   logger2.info('User ' + req.query.username + ' logged out');

    var response = {
        success: true
    };

    res.send(response);
});

module.exports = router;
