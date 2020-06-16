const winston = require("winston");
require('winston-daily-rotate-file');
const { format } = winston;
const { combine, timestamp, label, printf, json } = format;
const appConfig = require("../config/app.config");

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp}  ${level}  ${message}`;
});

// TODO: Update so logger names and log file paths are read from configuration file

// Configure file logging
winston.loggers.add(appConfig.S_SERVER, {
  format: combine(
    // format.colorize(),
    timestamp(),
    label({ label: appConfig.S_SERVER }),
    json()
  ),
  transports: [
    //new winston.transports.File({ filename: "./logs/systemDebug.log", level: "debug" }),
    new winston.transports.DailyRotateFile({
      filename: 'debug-%DATE%',
      extension:'.log',
      dirname:'logs',
      auditFile:'logs/debugAudit.json',
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),

    //new winston.transports.File({ filename: "./logs/systemMonitor.log", level: "http" }),
    new winston.transports.DailyRotateFile({
      filename: 'monitor-%DATE%',
      extension:'.log',
      dirname:'logs',
      auditFile:'logs/monitorAudit.json',
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),

    //new winston.transports.File({ filename: "./logs/systemError.log", level: "warn" }),
    new winston.transports.DailyRotateFile({
      filename: 'error-%DATE%',
      extension:'.log',
      dirname:'logs',
      auditFile:'logs/errorAudit.json',
      level: 'warn',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
  ]
});

// Configure console logging, only log when not in production
if (process.env.NODE_ENV !== "production") {
  winston.loggers.add(appConfig.S_CONSOLE, {
    format: combine(
      format.colorize(),
      timestamp(),
      label({ label: appConfig.S_CONSOLE }),
      myFormat
    ),
    transports: [
      new winston.transports.Console({ level: "info" })
    ]
  });
}

const fileLogger = winston.loggers.get(appConfig.S_SERVER);
const consoleLogger = winston.loggers.get(appConfig.S_CONSOLE);

fileLogger.info("Logging successfully initialized");
consoleLogger.info("Logging successfully initialized");
