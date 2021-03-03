const createError = require("http-errors");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const stylus = require("stylus");
const cors = require("cors");
const appConfig = require("./config/app.config");
const authConfig = require("./config/auth.config");
const logger = require("./utils/logger");

const indexRouter = require("./routes/index.route");
const loginRouter = require("./routes/login.route");
const signupRouter = require("./routes/signup.route");
const logoutRouter = require("./routes/logout.route");
const resetPasswordRouter = require("./routes/resetPassword.route");
const refreshTokenRouter = require("./routes/refreshToken.route");
const commentsRouter = require("./routes/comments.route");
const likeClipRouter = require("./routes/likeClip.route");
const likeCommentRouter = require("./routes/likeComment.route");
const followsRouter = require("./routes/follows.route");
const postClipRouter = require("./routes/clip.route");
const reportsRouter = require("./routes/reports.route");
const gamesRouter = require("./routes/games.route");
const browseGamesRouter = require("./routes/browseGames.route");
const browseRouter = require("./routes/browse.route");
const profileRouter = require("./routes/profile.route");
const singleGameRouter = require("./routes/singleGame.route");
const singleClipRouter = require("./routes/singleClip.route");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(authConfig.COOKIE_SECRET));
app.use(stylus.middleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

// DB sync
const db = require("./models");
db.sequelize.sync();

// Cors configuration
const clientUrl = appConfig.CLIENT_URL;
const allowList = [clientUrl];
const corsOptions = {
  origin: function (origin, callback) {
    if (allowList.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn("Origin " + origin + " not in allowList");
      callback(new Error("Not allowed by CORS"));
    }
  }
};

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept, Authorization"
  );

  res.header(
    "Access-Control-Allow-Credentials",
    true
  );

  next();
});

app.use("/", indexRouter);
app.use("/login", cors(corsOptions), loginRouter);
app.use("/signup", cors(corsOptions), signupRouter);
app.use("/logout", cors(corsOptions), logoutRouter);
app.use("/resetPassword", cors(corsOptions), resetPasswordRouter);
app.use("/refreshToken", cors(corsOptions), refreshTokenRouter);
app.use("/comments", cors(corsOptions), commentsRouter);
app.use("/likeClip", cors(corsOptions), likeClipRouter);
app.use("/likeComment", cors(corsOptions), likeCommentRouter);
app.use("/follows", cors(corsOptions), followsRouter);
app.use("/clip", cors(corsOptions), postClipRouter);
app.use("/reports", cors(corsOptions), reportsRouter);
app.use("/games", cors(corsOptions), gamesRouter);
app.use("/browseGames", cors(corsOptions), browseGamesRouter);
app.use("/browse", cors(corsOptions), browseRouter);
app.use("/profile", cors(corsOptions), profileRouter);
app.use("/singleGame", cors(corsOptions), singleGameRouter);
app.use("/singleClip", cors(corsOptions), singleClipRouter);

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
