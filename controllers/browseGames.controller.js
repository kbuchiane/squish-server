var start = null;

// Generates data for browseGames page
exports.browseGamesPage1 = (req, res, next) => {
    let username = req.query.username;
    let readOnlyView = false;

    start = new Date();

    if (!username) {
        // Allows for display only - no JWT token
        readOnlyView = true;
    }

    req.readOnlyView = readOnlyView;

    next();
    return;
}

// Generates data for browseGames page
exports.browseGamesPage2 = (req, res) => {
    let useCache = req.useCache;
    let results = req.results;
    let json = JSON.stringify(results);

    res.status(200).end(json);

    let end = (new Date() - start) / 1000;

    console.info('Request completed %ds  UsedCache: %s  Page: BrowseGames', end, useCache);
}
