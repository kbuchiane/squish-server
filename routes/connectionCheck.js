var express = require('express');
var router = express.Router();

/* GET call from client. */
router.get('/', function(req, res, next) {
  var msg = 'Hello ' + req.headers.referer + ', from: http://localhost:3000';
  console.log('sending: ' + msg);
  res.send(msg);
});

module.exports = router;
