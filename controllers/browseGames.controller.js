var start = null;

// Generates data for browseGames page
exports.browseGamesPage1 = (req, res, next) => {
    let useCache = req.useCache;
    let username = req.query.username;
    let readOnlyView = false;

    start = new Date();

    if (!username)
    {
        // Allows for display only - no JWT token
        readOnlyView = true;
    }

    req.readOnlyView = readOnlyView;

    console.log("** Step 1 **   browseGamesPage1  [" + username + "]  readOnly [" + readOnlyView + "]");

    next();
    return;
}

// Generates data for browseGames page
exports.browseGamesPage2 = (req, res) => {
    let username = req.query.username;
    let useCache = req.useCache;
    let results = req.results;
    let json = JSON.stringify(results);

    console.log("** Step 10 **  browseGames.controller.browseGamesPage2 enter  [" + username + "] [" + useCache + "]");

    res.status(200).end(json);

    let end = new Date() - start;
    // console.info('Request complete, execution time: %dms', end);
    console.info('Request complete, execution time: %ds', end / 1000);
}
