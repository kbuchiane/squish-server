var start = null;

// Generates data for browse page
exports.browsePage1 = (req, res, next) => {
    let username = req.query.username;
    let filter = req.query.filter;
    let timeframe = req.query.timeframe;
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

// Generates data for browse page
exports.browsePage2 = (req, res) => {
    let username = req.query.username;
    let useCache = req.useCache;
    let results = req.results;
    let json = JSON.stringify(results);

   console.log(results);

    res.status(200).end(json);

    let end = (new Date() - start) / 1000;

    console.info('Request completed %ds  UsedCache: %s  Page: Browse', end, useCache);
}
