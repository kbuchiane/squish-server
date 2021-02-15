const NodeCache = require("node-cache");
const logger = require("../utils/logger");

// TODO:
// add method to display metrics
// verify there isn't a memory leak
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

// Determine if cached response is to be used
check = (req, res, next) => {
    let username = req.query.username;
    let key = 'squish' + req.originalUrl || req.url;
    let useCache = true;
    let hasKey = myCache.has(key);

    if (!hasKey) {
        useCache = false;
    }

    req.useCache = useCache;

    next();
};


// Return cached value
get = (req, res, next) => {
    let username = req.query.username;
    let useCache = req.useCache;
    let key = 'squish' + req.originalUrl || req.url;

    if (useCache) {
        let value = myCache.get(key);

        if (value == undefined) {
            req.useCache = false
        }
        else {
            req.results = value;
        }
    }

    next();
};


// Cache results (non JSON response)
set = (req, res, next) => {
    let username = req.query.username;
    let useCache = req.useCache;
    let key = 'squish' + req.originalUrl || req.url;
    let results = req.results;

    if (!useCache) {
        let success = myCache.set(key, results, 180); // TTL 3 mins

        if (!success) {
            logger.error("Failed to cache results, user [" + username + "]  key [" + key + "]");
        }
    }

    next();
};

const caching = {
    check: check,
    set: set,
    get: get
};

module.exports = caching;