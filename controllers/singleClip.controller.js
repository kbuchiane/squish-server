var start = null;

// Generates data for singleClip page
exports.singleClipPage1 = (req, res, next) => {
    let username = req.query.username;
    let clipId = req.query.clipId;
    let readOnlyView = false;
    let url = req.originalUrl || req.url;

    start = new Date();

    // console.info("Request SingleClip [" + url + "]");

    if (!username) {
        // Allows for display only - no JWT token
        readOnlyView = true;
    }

    req.readOnlyView = readOnlyView;

    next();
    return;
}

// Generates data for singleClip page
exports.singleClipPage2 = (req, res) => {
    let username = req.query.username;
    let clipId = req.query.clipId;
    let useCache = req.useCache;
    let results = req.results[0];
    let json = JSON.stringify(results);

    res.status(200).end(json);

    let end = (new Date() - start) / 1000;

    console.info('Request completed %ds  UsedCache: %s  Page: SingleClip', end, useCache);
}