var express = require('express');
var router = express.Router();

/* GET call from client. */
router.get('/', function(req, res, next) {
  console.log('connection hit');
  res.send('Server response!');
});

module.exports = router;
