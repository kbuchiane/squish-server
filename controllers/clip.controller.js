const db = require("../models");
const dateUtil = require("../utils/dateUtil");
const workflowUtil = require("../utils/workflowUtil");
const logger = require("../utils/logger");
const fs = require("fs");
const moment = require("moment");

const Op = db.Sequelize.Op;
const User = db.user;
const Clip = db.clip;
const Game = db.game;

/*
Should eventually do file metadata processing to prevent users from accidentally 
(or intentionally and perhaps maliciously) uploading the same file many times.
Currently we don't perform any check, so a video can be uploaded many times over.
If you're testing this, make sure you occasionally clean out the local destination 
directory or this will fill up your disk.

This doesn't currently perform the intended functionality.  Right now all this 
does is copy a file from the local file system to a new directory and make the 
database calls needed to store and construct unique file paths for each user.

This code will need to be updated with video streaming functionality once later 
architectural and dependency decisions are made. We will want the user's clip to 
be streamed incrementally to the server, be fault tolerant, and be able to save 
the video that's being loaded into memory onto disk once the upload is complete. 
Since we want this to be as easy for users as possible, we'll probably want the 
solution that will result in the least amount of processing time for the user/ 
client in order to free up their browser. I did some light research into this, 
but didn't immediately find anything that stood out as fitting our needs.

Ideas:
-Compress file on client side so that transfer is faster. Can you even compress 
a video file? Is it faster?
-How does Youtube uploading work? How fast is it?
-There are other things that have to happen after a video is uploaded before it 
can be viewed. What are those things?

File copy drops file extension. Video/thumbnail are still viewable, but throw 
warning when trying to view.
*/

exports.postClip = (req, res) => {
    let title = req.body.title;
    let game = req.body.game;
    let username = req.body.user;
    let video = req.body.video;
    let thumbnail = req.body.thumbnail;

    if (!video) {
        let msg = "Please select a clip to upload";
        return res.status(400).send({ message: msg });
    } else if (!thumbnail) {
        let msg = "Please select a thumbnail to upload";
        return res.status(400).send({ message: msg });
    } else if (!title) {
        let msg = "Please enter a title for the clip";
        return res.status(400).send({ message: msg });
    } else if (title.length > 80) {
        let msg = "The clip title must be 80 characters or less";
        return res.status(400).send({ message: msg });
    } else if (!game) {
        let msg = "Please enter a game for the clip";
        return res.status(400).send({ message: msg });
    } else if (game.length > 50) {
        let msg = "The game must be 80 characters or less";
        return res.status(400).send({ message: msg });
    } else if (!username) {
        let msg = "You must be logged in to post a clip";
        return res.status(400).send({ message: msg });
    }

    // TODO: Find duration of video file from the file's metadata
    let duration = req.body.duration;

    if (!duration) {
        let msg = "The duration of the uploaded clip could not be determined. Please try again.";
        return res.status(400).send({ message: msg });
    } else if (duration > 30) {
        let msg = "The duration of the uploaded clip must be 30 seconds or less. Please try again.";
        return res.status(400).send({ message: msg });
    }

    let dateCreated = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);

    User.findOne({
        where: {
            [Op.and]: [
                { Username: username },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to add comment, user " + commenter + " was not found.";
            return res.status(400).send({ message: msg });
        }

        let userId = user.UserId;
        Game.findOne({
            where: {
                Title: game
            }
        }).then(game => {
            if (!game) {
                let msg = "Unable to find game " + game + ".";
                return res.status(400).send({ message: msg });
            }
            let gameId = game.GameId;
            Clip.create({
                UserId: userId,
                Title: title,
                GameId: gameId,
                Duration: duration,
                DateCreated: dateCreated,
                ViewCount: 0
            }).then(clip => {
                let clipId = clip.ClipId;
                let videoFilePath = username + "/" + clipId;
                let thumbnailFilePath = username + "/" + clipId + "-thumbnail";
                Clip.update({
                    VideoFilepath: videoFilePath,
                    thumbnail: thumbnailFilePath
                },
                    {
                        where: {
                            ClipId: clipId
                        }
                    }).then(clip => {
                        let relativeClipPath = "./clips/" + videoFilePath;
                        let relativeThumbnailPath = "./clips/" + thumbnailFilePath;

                        fs.stat("./clips/" + username, function (error, stats) {
                            if (stats == null) {
                                fs.mkdir("./clips/" + username, error => {
                                    if (error) {
                                        logger.error(error);
                                        throw (error);
                                    }
                                });
                            }
                            fs.copyFile("../squish-client/src/assets/videos/snipe1.mp4", relativeClipPath, error => {
                                if (error) {
                                    logger.error(error);
                                    throw (error);
                                }
                            });
                            fs.copyFile("../squish-client/src/assets/images/snipe1poster.png", relativeThumbnailPath, error => {
                                if (error) {
                                    logger.error(error);
                                    throw (error);
                                }
                            });
                        })

                        return res.status(200).send();
                    }).catch(err => {
                        let msg = "Add clip error, " + err.message;
                        logger.error(msg);
                        return res.status(400).send({
                            message: msg
                        });
                    });

                return res.status(200);
            }).catch(err => {
                let msg = "Add clip error, " + err.message;
                logger.error(msg);
                return res.status(400).send({
                    message: msg
                });
            });
        }).catch(err => {
            let msg = "Add clip error, " + err.message;
            logger.error(msg);
            return res.status(400).send({
                message: msg
            });
        });
    });
}

exports.deleteClip = (req, res) => {
    let username = req.body.user;
    let clipId = req.body.clipId;

    Clip.findOne({
        where: {
            VideoFilepath: username + "/" + clipId
        }
    }).then(clip => {
        if (!clip) {
            let msg = "Unable to delete clip. Clip was not found.";
            return res.status(400).send({ message: msg });
        }
        if (!clip.ClipId) {
            let msg = "Invalid delete request. Please try again.";
            return res.status(400).send({ message: msg });
        }
        Clip.destroy({
            where: {
                ClipId: clipId
            }
        }).then(clip => {
            fs.stat("./clips/" + username + "/" + clipId, function (error, stats) {
                if (stats != null) {
                    fs.unlink("./clips/" + username + "/" + clipId, error => {
                        if (error) {
                            logger.error("Failed to delete clip from local disk");
                        }
                    });
                }
            });
            fs.stat("./clips/" + username + "/" + clipId + "-thumbnail", function (error, stats) {
                console.log("thumnail exists");
                if (stats != null) {
                    fs.unlink("./clips/" + username + "/" + clipId + "-thumbnail", error => {
                        console.log("thumbnail deleted");
                        if (error) {
                            logger.error("Failed to delete thumbnail from local disk");
                        }
                    });
                }
            });
            return res.status(200).send();
        }).catch(err => {
            let msg = "Delete clip error, " + err.message;
            logger.error(msg);
            return res.status(500).send({
                message: msg
            });
        });
    });
}

exports.getClip = (req, res) => {
    let clipId = req.query.clipId;

    if (!clipId) {
        let msg = "Unable to get clip, ID is undefined.";
        return res.status(400).send({ message: msg });
    }

    getValuesForClip(clipId, false).then(clip => {
        if (!clip) {
            let msg = "Clip was not found.";
            return res.status(400).send({ message: msg });
        }

        let json = JSON.stringify(clip);
        res.status(200).end(json);
    }).catch(err => {
        let msg = "Failed to find clip, " + err.message;
        logger.warn(msg);
        return res.status(400).send({ message: msg });
    });
}

// Generates data for profile page
exports.profilePage = (req, res, next) => {
    let profileName = req.query.profileName;
    let useCache = req.useCache;

    if (useCache) {
        next();
        return;
    }

    // Get clips for profile name
    getClipsForUser(profileName).then(clips => {
        if (clips) {
            // Retain clipsCount in workflow for use later in Profile page workflow
            req.workflow = workflowUtil.setValue(workflowUtil.CLIPS_COUNT_KEY, clips.length, req.workflow);

            // Builds out profile page with clip vlues
            buildProfileForClips(clips).then(results => {
                req.results = results;

                next();
            });
        }
    }).catch(err => {
        let msg = "Failed to get data for Profile page, " + err;
        logger.error(msg);
        // TODO what's the best way to handle this?  Implement solution everywhere
    });
}

// Generates data for singleClip page
exports.singleClipPage = (req, res, next) => {
    let useCache = req.useCache;
    let clipId = req.query.clipId;

    if (useCache) {
        next();
        return;
    }

    // Get values for clip and include extended values
    getValuesForClip(clipId, true).then(results => {
        req.results = results;
        next();
    });
}

// Generates data for singleGame page
exports.singleGamePage = (req, res, next) => {
    let useCache = req.useCache;
    let gameId = req.query.gameId;

    if (useCache) {
        next();
        return;
    }

    // Get clips for game id
    getClipValuesForGame(gameId).then(results => {
        req.results = results;
        next();
    });
}

// Generates data for browse page
exports.getClipsForFilterAndTimeframe = (req, res, next) => {
    let useCache = req.useCache;
    let filter = req.query.filter;
    let timeframe = req.query.timeframe;

    if (useCache) {
        next();
        return;
    }

    // Get clip values based on filter and timeframe settings
    getClipValuesForFilterAndTimeframe(filter, timeframe).then(results => {
        req.results = results;
        next();
    });
}

// Generates data for Browse and BrowseGames pages
exports.getClipCountsforGames = (req, res, next) => {
    let useCache = req.useCache;

    if (useCache) {
        next();
        return;
    }

    // Start with results from previous steps
    let results = req.results;

    (async function loop() {
        for (let i = 0; i < results.length; i++) {
            await new Promise(resolve => {
                let gameId = results[i].Game.GameId;

                getClipsTodayAndAllTimeCount(gameId).then(clipTodayAndAllTimeCount => {
                    let counts = clipTodayAndAllTimeCount.split(":");
                    let clipsTodayCount = counts[0];
                    let clipsAllTimeCount = counts[1];

                    if (results[i].Game) {
                        results[i].Game.ClipsTodayCount = clipsTodayCount;
                        results[i].Game.ClipsAllTimeCount = clipsAllTimeCount;
                    }

                    resolve();
                }).catch(err => {
                    let msg = "Failed to find today and all-time clip count for game " + gameId + ", " + err.message;
                    logger.warn(msg);
                    // Currently no reject
                });
            });
        }
        next();
    })();
}

// Returns game clips for today and for all-time
function getClipsTodayAndAllTimeCount(gameId) {
    var todayAndAllTimeCount = '0:0';

    return new Promise(function (resolve, reject) {
        if (!gameId) {
            let msg = "Unable to get clip today count, gameId is null.";
            logger.warn(msg);
            reject(msg);
        }

        Clip.findAll({
            where: {
                GameId: gameId
            }
        }).then(clips => {
            if (clips) {
                // Loop thru games to determine those from today (no adjustment for GMT)
                let today = moment(Date.now()).format("YYYY-MM-DD");
                let allTimeCount = clips.length;
                let todayCount = 0;

                clips.forEach(clip => {
                    let dateCreated = moment(clip.DateCreated).format("YYYY-MM-DD");
                    if (dateCreated === today) {
                        todayCount = todayCount + 1;
                    }
                });

                todayAndAllTimeCount = todayCount + ":" + allTimeCount;
            }

            resolve(todayAndAllTimeCount);
        }).catch(err => {
            let msg = "Search for clips today count failed, " + err.message;
            logger.error(msg);
            reject(msg);
        });
    });
}

function getClipValuesForFilterAndTimeframe(filter, timeframe) {
    var results = [];

    return new Promise(function (resolve, reject) {
        // TODO: Add filter field to Clip table (array containing filters that apply for this clip)
        // TODO: Timeframe needs to be implementd (will default to all-time)

        /*
         TODO: decide if more efficient to make db call with filter and timeframe WHERE clause or traverse
         all-clips array and remove those that do not apply.  Going with second option for now.
         */

        getAllClipValues().then(clips => {
            if (!clips || clips.length < 1) {
                let msg = "No clips were found.";
                reject(msg);
            }

            clips.forEach(clip => {
                let hasFilter = checkChipFilters(filter, clip.Filters);

                if (hasFilter) {
                    let inTimeframe = checkTimeframe('all', clip.DateCreated); // FIXME: hardcoded to all

                    if (inTimeframe) {
                        results.push(clip);
                    }
                }
            });

            resolve(results);

        }).catch(err => {
            let msg = "Failed to get all clips for filter and timeframe, " + err.message;
            logger.warn(msg);
            reject(msg);
        });
    });
}

function getValuesForClip(clipId, extendedValues) {
    var results = [];

    return new Promise(function (resolve, reject) {
        if (!clipId) {
            let msg = "Unable to get clip, ID is undefined.";
            reject(msg);
            return;
        }

        Clip.findOne({
            where: {
                ClipId: clipId
            }
        }).then(clip => {
            if (!clip) {
                let msg = "Clip was not found.";
                reject(msg);
                return;
            }

            let values = null;

            if (extendedValues) {
                values = getClipValuesExtended(clip);
            }
            else {
                values = getClipValues(clip);
            }

            results.push(values);

            resolve(results);
        }).catch(err => {
            let msg = "Failed to find clip, " + err.message;
            logger.warn(msg);
            reject(msg);
        });
    });
}

function getAllClipValues() {
    var results = [];

    return new Promise(function (resolve, reject) {
        Clip.findAll().then(clips => {
            if (!clips || clips.length < 1) {
                let msg = "No clips were found.";
                logger.warn(msg);
                reject(msg);
            }

            for (let index = 0; index < clips.length; index++) {
                let clip = clips[index];
                let values = getClipValuesExtended(clip);

                results.push(values);
            }

            resolve(results);
        }).catch(err => {
            let msg = "Failed to find clips, " + err.message;
            logger.warn(msg);
            reject(msg);
        });
    });
}

// Returns array of clips for active user
function getClipsForUser(username) {
    return new Promise(function (resolve, reject) {
        User.findOne({
            where: {
                [Op.and]: [
                    { Username: username },
                    { Active: true }
                ]
            }
        }).then(user => {
            if (!user) {
                let msg = "Unable to get clips, user " + username + " was not found or inactive";
                logger.warn(msg);
                reject(msg);
            }

            Clip.findAll({
                where: {
                    UserId: user.UserId
                }
            }).then(clips => {
                resolve(clips);
            }).catch(err => {
                let msg = "Failed to get clips for user " + username + ", " + err.message;
                logger.error(msg);
                reject(msg);
            });
        }).catch(err => {
            let msg = "Failed to get clips for user " + username + ", " + err.message;
            logger.error(msg);
            reject(msg);
        });
    });
}



// TODO rename - seperate getting all clips from setting other values like metrics
function buildProfileForClips(clips) {
    var results = [];

    return new Promise(function (resolve, reject) {
        for (let index = 0; index < clips.length; index++) {
            let clip = clips[index];
            let values = getClipValuesExtended(clip);

            results.push(values);
        }

        resolve(results);
    });
}

// TODO possibly pass Title too for better error messages
function getClipValuesForGame(gameId) {
    var results = [];

    return new Promise(function (resolve, reject) {
        Clip.findAll({
            where: {
                GameId: gameId
            }
        }).then(clips => {
            if (!clips) {
                let msg = "No clips found for gameId " + gameId + ".";
                logger.warn(msg);
                reject(msg);
            }

            for (let index = 0; index < clips.length; index++) {
                let clip = clips[index];
                let values = getClipValuesExtended(clip);

                results.push(values);
            }

            resolve(results);

        }).catch(err => {
            let msg = "Failed to find clips for game " + gameId + ", " + err.message;
            logger.error(msg);
            reject(msg);
        });
    });
}

// TODO implement me
function getCommentsForClip(clipId) {
    let response = {
        CommentCount: "7",
        Comments: [
            {
                CommentId: "1",
                Username: "JackiePrince",
                Text: "Wow, this is the best clip I've ever seen!",
                DateCreated: "Dec 25, 2020",
                Liked: true,
                Likes: "203k",
                Comments: [
                    {
                        CommentId: "2",
                        Username: "Jon",
                        Text: "You're a scrub.",
                        DateCreated: "Dec 25, 2020",
                        Liked: false,
                        Likes: "0",
                        Comments: [
                            {
                                CommentId: "3",
                                Username: "JackiePrince",
                                Text: "No u.",
                                DateCreated: "Dec 25, 2020",
                                Liked: true,
                                Likes: "5.2M",
                                Comments: [],
                            },
                            {
                                CommentId: "4",
                                Username: "shroud",
                                Text:
                                    "Harsh. Jackie would beat me in a 1v1 99 times out of 100.",
                                DateCreated: "Dec 25, 2020",
                                Liked: true,
                                Likes: "103.5k",
                                Comments: [],
                            },
                        ],
                    },
                    {
                        CommentId: "5",
                        Username: "Jack",
                        Text: "Lame. Play Astrofire.",
                        DateCreated: "Dec 25, 2020",
                        Liked: false,
                        Likes: "1",
                        Comments: [],
                    },
                ],
            },
            {
                CommentId: "6",
                Username: "chocoTaco",
                Text: "OMG",
                DateCreated: "Dec 26, 2020",
                Liked: true,
                Likes: "17k",
                Comments: [],
            },
            {
                CommentId: "7",
                Username: "GrndpaGaming",
                Text: "Reported.",
                DateCreated: "Dec 27, 2020",
                Liked: false,
                Likes: "0",
                Comments: [],
            },
        ]
    }

    return response;
}

// TODO implement me
function getFiltersForClip(clipId) {
    let filters = ['MostPopular', 'FollowedUsersOnly', 'SpecificGames', 'MostImpressive', 'Funniest', 'BestDiscussion'];

    return filters;
}

// TODO fully implement me
function checkTimeframe(timeframe, date) {
    var inTimeframe = false;

    if (timeframe) {
        let period = timeframe.toLowerCase();

        if (period == 'day') {

        }
        else if (period == 'week') {

        }
        else if (period == 'month') {

        }
        else if (period == 'year') {

        }
        else if (period == 'all') {
            inTimeframe = true;
        }
    }

    return inTimeframe;
}

// Current Filters: MostPopular, FollowedUsersOnly, SpecificGames, MostImpressive, Funniest, BestDiscussion
function checkChipFilters(filter, clipFilters) {
    var hasFilter = false;

    if (filter && clipFilters) {
        if (clipFilters.includes(filter)) {
            hasFilter = true;
        }
    }

    return hasFilter;
}

function getClipValues(clip) {
    let displayDate = dateUtil.getDisplayDbDate(clip.DateCreated);

    // NOTE: contains only fields from clip table

    let values = {
        ClipId: clip.ClipId,
        UserId: clip.UserId,
        VideoFilepath: clip.VideoFilepath,
        Title: clip.Title,
        GameId: clip.GameId,
        Duration: clip.Duration,
        DateCreated: clip.DateCreated,
        DisplayDate: displayDate,
        Thumbnail: clip.Thumbnail,
        ViewCount: clip.ViewCount
    };

    return values;
}

function getClipValuesExtended(clip) {
    let commentsForClip = getCommentsForClip(clip.ClipId);
    let filtersForClip = getFiltersForClip(clip.ClipId);
    let displayDate = dateUtil.getDisplayDbDate(clip.DateCreated);

    let values = {
        ClipId: clip.ClipId,
        Type: clip.Type,
        UserId: clip.UserId,
        VideoFilepath: clip.VideoFilepath,
        Title: clip.Title,
        GameId: clip.GameId,
        Duration: clip.Duration,
        DateCreated: clip.DateCreated,
        DisplayDate: displayDate,
        Thumbnail: clip.Thumbnail,
        ViewCount: clip.ViewCount,

        CommentCount: commentsForClip.CommentCount,
        Comments: commentsForClip.Comments,

        Filters: filtersForClip
    };

    return values;
}