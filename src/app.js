var express = require("express");
var buttonHandler = require('./routes/buttonHandler');

var app = new express();
var port = 8080;

buttonHandler(app);

app.listen(port);

// Console will print the message
console.log('Server running at http://127.0.0.1:' + port + '/');