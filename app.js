var logger = require("./utils/logger");
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

var stylus = require("stylus");
var cors = require("cors");
const appConfig = require("./config/app.config");

var indexRouter = require("./routes/index.route");
var loginRouter = require("./routes/login.route");
var signupRouter = require("./routes/signup.route");
var logoutRouter = require("./routes/logout.route");
var forgotPasswordRouter = require("./routes/forgotPassword.route");
var refreshTokenRouter = require("./routes/refreshToken.route");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

// DB sync
const db = require("./models");
db.sequelize.sync();

// Cors configuration
var clientUrl = appConfig.CLIENT_URL;
var whitelist = [clientUrl];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept, Authorization"
  );

  next();
});

app.use("/", indexRouter);
app.use("/login", cors(corsOptions), loginRouter);
app.use("/signup", cors(corsOptions), signupRouter);
app.use("/logout", cors(corsOptions), logoutRouter);
app.use("/forgotPassword", cors(corsOptions), forgotPasswordRouter);
app.use("/refreshToken", cors(corsOptions), refreshTokenRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
