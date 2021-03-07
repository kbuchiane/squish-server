var start = null;

// Generates data for singleGame page
exports.singleGamePage1 = (req, res, next) => {
    let username = req.query.username;
    let gameId = req.query.gameId;
    let readOnlyView = false;
    let url = req.originalUrl || req.url;

    start = new Date();

    if (!username) {
        // Allows for display only - no JWT token
        readOnlyView = true;
    }

    req.readOnlyView = readOnlyView;

    next();
    return;
}

// Generates data for profile page
exports.singleGamePage2 = (req, res) => {
    let username = req.query.username;
    let gameId = req.query.gameId;
    let useCache = req.useCache;
    let results = req.results;
    let json = JSON.stringify(results);

    // console.log(results);

    res.status(200).end(json);

    let end = (new Date() - start) / 1000;

    console.info('Request completed %ds  UsedCache: %s  Page: SingleGame', end, useCache);
}