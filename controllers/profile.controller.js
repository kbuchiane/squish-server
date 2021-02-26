var start = null;

// Generates data for browse page
exports.profilePageStart = (req, res, next) => {
    let username = req.query.username;
    let profileName = req.query.profileName;
    let readOnlyView = false;
    let url = req.originalUrl || req.url;

    // Required for future workflow step getGamesFollowedByUser
    req.query.username = req.query.profileName;
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
exports.profilePageComplete = (req, res) => {
    let username = req.query.username;
    let profileName = req.query.profileName;
    let useCache = req.useCache;
    let results = req.results;
    let json = JSON.stringify(results);
    
    res.status(200).end(json);

    let end = (new Date() - start) / 1000;

    console.info('Request completed %ds  UsedCache: %s  Page: Profile', end, useCache);
}