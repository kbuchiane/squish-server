const winston = require("winston");
const { format } = winston;
const { combine, timestamp, label, printf, json } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp}  ${level}  ${message}`;
});

// TODO: Update so logger names and log file paths are read from configuration file

// Configure file logging
winston.loggers.add("squish-server", {
  format: combine(
    // format.colorize(),
    timestamp(),
    label({ label: "squish-server" }),
    json()
  ),
  transports: [
    //new winston.transports.Console({ level: 'debug' }),
    new winston.transports.File({ filename: "./logs/systemDebug.log", level: "debug" }),
    new winston.transports.File({ filename: "./logs/systemMonitor.log", level: "http" }),
    new winston.transports.File({ filename: "./logs/systemError.log", level: "warn" }),
  ]
});

// Configure console logging, only log when not in production
if (process.env.NODE_ENV !== "production") {
  winston.loggers.add("squish-console", {
    format: combine(
      format.colorize(),
      timestamp(),
      label({ label: "squish-console" }),
      myFormat
    ),
    transports: [
      new winston.transports.Console({ level: "info" })
    ]
  });
}

const fileLogger = winston.loggers.get("squish-server");
const consoleLogger = winston.loggers.get("squish-console");

fileLogger.info("Logging successfully initialized");
consoleLogger.info("Logging successfully initialized");
