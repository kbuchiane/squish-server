const appConfig = require("../config/app.config");
const logger = require("./logger");
const moment = require("moment");
const DISPLAY_DATE_FORMAT = "MMM DD, YYYY";
const GAME_DATE_FORMAT = "MMM YYYY";
const DEFAULT_DATE = moment(new Date(0)).utc().format(DISPLAY_DATE_FORMAT);

function getDisplayDate(date) {
    if (isDateValid(date)) {
        return moment(date).format(DISPLAY_DATE_FORMAT);
    }

    let msg = "Date " + date + " is invalid, using default 1970";
    logger.warn(msg);

    return DEFAULT_DATE;
}

function getDisplayDateForFormat(date, format) {
    if (isDateValid(date)) {
        return moment(date).format(format);
    }

    let msg = "Date " + date + " is invalid, using default 1970";
    logger.warn(msg);

    return DEFAULT_DATE;
}

// Expects dbDate to be in format "YYYY-MM-DD HH:mm:ss" (UTC)
function getDisplayDbDate(dbDate) {
    if (isDbDateValid(dbDate)) {
        return moment(dbDate).format(DISPLAY_DATE_FORMAT);
    }

    let msg = "Date " + dbDate + " is invalid, using default 1970. Expected format YYYY-MM-DD HH:mm:ss";
    logger.warn(msg);

    return DEFAULT_DATE;
}

function isDateValid(date) {
    return moment(date, true).isValid();
}

function isDbDateValid(dbDate) {
    return moment(dbDate, appConfig.DB_DATE_FORMAT, true).isValid();
}

const dateUtil = {
    DISPLAY_DATE_FORMAT,
    GAME_DATE_FORMAT,
    getDisplayDate: getDisplayDate,
    getDisplayDateForFormat: getDisplayDateForFormat,
    getDisplayDbDate: getDisplayDbDate,
    isDateValid: isDateValid,
    isDbDateValid: isDbDateValid
};

module.exports = dateUtil;