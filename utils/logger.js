const winston = require("winston");
require('winston-daily-rotate-file');
const { format } = winston;
const { combine, timestamp, label, printf, json } = format;
const appConfig = require("../config/app.config");

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp}  ${level}  ${message}`;
});

var debugTransport = new (winston.transports.DailyRotateFile)({
  filename: 'debug-%DATE%',
  extension: '.log',
  dirname: 'logs',
  auditFile: 'logs/debugAudit.json',
  level: 'debug',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

var monitorTransport = new (winston.transports.DailyRotateFile)({
  filename: 'monitor-%DATE%',
  extension: '.log',
  dirname: 'logs',
  auditFile: 'logs/monitorAudit.json',
  level: 'info',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

var errorTransport = new (winston.transports.DailyRotateFile)({
  filename: 'error-%DATE%',
  extension: '.log',
  dirname: 'logs',
  auditFile: 'logs/errorAudit.json',
  level: 'warn',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const logger = winston.createLogger({
  format: combine(
    // format.colorize(),
    timestamp(),
    label({ label: appConfig.S_SERVER }),
    json()
  ),

  transports: [
    debugTransport, monitorTransport, errorTransport
  ]
});

// Configure console logging, only log when not in production
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    level: "info",
    format: combine(
      format.colorize(),
      timestamp(),
      label({ label: appConfig.S_CONSOLE }),
      myFormat
    ),
  }));
}

logger.info("Logging successfully initialized");

module.exports = logger;