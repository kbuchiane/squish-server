var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var stylus = require('stylus');
var cors = require('cors');
var mysql = require('mysql');

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var signupRouter = require('./routes/signup');
var logoutRouter = require('./routes/logout');
var forgotPasswordRouter = require('./routes/forgotPassword');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connector
var dbConn = mysql.createConnection({
  host: "localhost",
  user: process.env.db_username,
  password: process.env.db_password,
  database: "squish"
});

dbConn.connect(function(err) {
  if (err) throw err;
  console.log("connected to database");
});

// Cors configuration
var clientUrl = 'http://localhost:8080';
var whitelist = [clientUrl];
var corsOptions = {
  origin: function (origin, callback) {
    if (origin === undefined) {
      callback(null, true);
    } else if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use('/', indexRouter);
app.use('/login', cors(corsOptions), loginRouter);
app.use('/signup', cors(corsOptions), signupRouter);
app.use('/logout', cors(corsOptions), logoutRouter);
app.use('/forgotPassword', cors(corsOptions), forgotPasswordRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
