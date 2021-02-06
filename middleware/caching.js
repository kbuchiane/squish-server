const NodeCache = require( "node-cache" );
const logger = require("../utils/logger");

const myCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );

// Determine if cached response is to be used
check = (req, res, next) => {
    let username = req.query.username;
    let key = 'squish' + req.originalUrl || req.url;
    let useCache = true;
    let hasKey = myCache.has(key);

    if (!hasKey)
    {
        useCache = false;
    }

    req.useCache = useCache;  
    
    console.log("** Step 3 **  CHECK if we should use cache,   user [" + username + "] [" + useCache + "]");

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
    
    console.log("** Step 4 **   GET  [" + username + "] [" + useCache + "] [" + key + "]");

    next();
};


// Cache results (non JSON response)
set = (req, res, next) => {
    let username = req.query.username;
    let useCache = req.useCache;
    let key = 'squish' + req.originalUrl || req.url;
    let results = req.results;

    if (useCache) {
        // Already used cache results, no need to save again
        console.log("** Step 9 **  SET  Already using Cache Results, no SAVE  [" + username + "] [" + key + "]");
    }
    else {
        let success = myCache.set( key, results, 180 ); // TTL 3 mins
    
        console.log("** Step 9 **  SET  Cache Results  [" + username + "] [" + key + "]  success:" + success);
    }

    next();
};

const caching = {
    check: check,
    set: set,
    get: get
};

module.exports = caching;