const logger = require("./logger");

function isJson(value) {
    try {
        let json = JSON.parse(value);

        return true;
    } catch (e) {
        let msg = "Value is not JSON";
        logger.warn(msg);

        return false;
    }
}

const miscUtil = {
    isJson: isJson
};

module.exports = miscUtil;