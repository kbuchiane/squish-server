var http = require('http');
var express = require("express");

var app = new express();

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write('Hello World!');
  res.end();
}).listen(8080);

// Console will print the message
console.log('Server running at http://127.0.0.1:8080/');