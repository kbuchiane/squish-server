const db = require("../models");
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

    //Find duration of video file
    let duration = req.body.duration;

    //Find date created from file metadata
    let dateCreated = req.body.date;

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

        let posterId = user.UserId;
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
                PosterUserId: posterId,
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
                    Poster: thumbnailFilePath
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
            let msg = "Invalid delete request.  Please try again.";
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

    Clip.findOne({
        where: {
            ClipId: clipId
        }
    }).then(clip => {
        if (!clip) {
            let msg = "Clip was not found.";
            return res.status(400).send({ message: msg });
        }

        // NOTE: response contains only fields from clip table
        response = {
            ClipId: clip.ClipId,
            PosterUserId: clip.PosterUserId,
            VideoFilepath: clip.VideoFilepath,
            Title: clip.Title,
            GameId: clip.GameId,
            Duration: clip.Duration,
            DateCreated: clip.DateCreated,
            Poster: clip.Poster,
            ViewCount: clip.ViewCount
        };

        res.status(200).end(JSON.stringify(response));
    });
}


// Generates data for profile page
exports.profilePage = (req, res, next) => {
    let readOnlyView = req.readOnlyView;
    let profileName = req.query.profileName;
    let useCache = req.useCache;
    let username = req.query.username;

    if (useCache) {
        next();
        return;
    }

    // Get clips for profile name
    getAllClipsForUser(profileName).then(results => {
        req.results = results;
        next();
    });
}

// Generates data for singleGame page
exports.singleGamePage = (req, res, next) => {
    let readOnlyView = req.readOnlyView;
    let useCache = req.useCache;
    let username = req.query.username;
    let gameId = req.query.gameId;

    if (useCache) {
        next();
        return;
    }

    // Get clips for game id
    getAllClipsForGame(gameId).then(results => {
        req.results = results;
        next();
    });
}

// Generates data for browse page
exports.browsePage = (req, res, next) => {
    let readOnlyView = req.readOnlyView;
    let useCache = req.useCache;
    let username = req.query.username;
    let filter = req.query.filter;
    let timeframe = req.query.timeframe;

    if (useCache) {
        next();
        return;
    }

    // Get clips for filter and timeframe
    getAllClipsForFilterAndTimeframe(filter, timeframe).then(results => {
        req.results = results;
        next();
    });
}

// Generates data for Browse and BrowseGames pages
exports.getClipCountsforGames = (req, res, next) => {
    let readOnlyView = req.readOnlyView;
    let username = req.query.username;
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
                let gameId = results[i].GameId;

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
                    reject(msg);
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

        // TODO may make sense to make a new table with all the different totals

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

function getAllClipsForFilterAndTimeframe(filter, timeframe) {
    var results = [];

    return new Promise(function (resolve, reject) {

        // TODO: Add filter field to Clip table (array containing filters that apply for this clip)
        // TODO: Timeframe needs to be implementd (will default to all-time)

        /*
         TODO: decide if more efficient to make db call with filter and timeframe WHERE clause or traverse
         all-clips array and remove those that do not apply.  Going with second option for now.
         */

        getAllClips().then(clips => {

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

function getAllClips() {
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

                let commentsForClip = getCommentsForClip(clip.ClipId);
                let metricsForClip = getMetricsForClip(clip.ClipId);
                let filtersForClip = getFiltersForClip(clip.ClipId);

                let response = {
                    ClipId: clip.ClipId,
                    Type: clip.Type,
                    PosterUserId: clip.PosterUserId,
                    VideoFilepath: clip.VideoFilepath,
                    Title: clip.Title,
                    GameId: clip.GameId,
                    Duration: clip.Duration,
                    DateCreated: clip.DateCreated,
                    Poster: clip.Poster,
                    ViewCount: clip.ViewCount,

                    Liked: metricsForClip.Liked,
                    UserImage: metricsForClip.UserImage,
                    BadgeOne: metricsForClip.BadgeOne,
                    BadgeTwo: metricsForClip.BadgeTwo,
                    BadgeThree: metricsForClip.BadgeThree,
                    BadgeFour: metricsForClip.BadgeFour,
                    ImpressiveLiked: metricsForClip.ImpressiveLiked,
                    ImpressiveCount: metricsForClip.ImpressiveCount,
                    FunnyLiked: metricsForClip.FunnyLiked,
                    FunnyCount: metricsForClip.FunnyCount,
                    DiscussionLiked: metricsForClip.DiscussionLiked,
                    DiscussionCount: metricsForClip.DiscussionCount,
                    ViewCount: metricsForClip.ViewCount,
                    LikeCount: metricsForClip.LikeCount,
                    CommentCount: commentsForClip.CommentCount,
                    Comments: commentsForClip.Comments,
                    Filters: filtersForClip
                };

                results.push(response);
            }

            resolve(results);
        })
            .catch(err => {
                let msg = "Failed to find clips, " + err.message;
                logger.warn(msg);
                reject(msg);
            });
    });
}

function getAllClipsForUser(username) {
    var results = [];

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
                let msg = "Unable to get all clips, user " + username + " was not found.";
                logger.warn(msg);
                reject(msg);
            }

            let posterUserId = user.UserId;
            Clip.findAll({
                where: {
                    PosterUserId: posterUserId
                }
            }).then(clips => {
                if (!clips) {
                    let msg = "No clips found for user " + username + ".";
                    logger.warn(msg);
                    reject(msg);
                }

                for (let index = 0; index < clips.length; index++) {
                    let clip = clips[index];
                    let commentsForClip = getCommentsForClip(clip.ClipId);
                    let metricsForClip = getMetricsForClip(clip.ClipId);
                    let filtersForClip = getFiltersForClip(clip.ClipId);

                    let response = {
                        ClipId: clip.ClipId,
                        Type: clip.Type,
                        PosterUserId: clip.PosterUserId,
                        VideoFilepath: clip.VideoFilepath,
                        Title: clip.Title,
                        GameId: clip.GameId,
                        Duration: clip.Duration,
                        DateCreated: clip.DateCreated,
                        Poster: clip.Poster,
                        ViewCount: clip.ViewCount,

                        Liked: metricsForClip.Liked,
                        UserImage: metricsForClip.UserImage,
                        BadgeOne: metricsForClip.BadgeOne,
                        BadgeTwo: metricsForClip.BadgeTwo,
                        BadgeThree: metricsForClip.BadgeThree,
                        BadgeFour: metricsForClip.BadgeFour,
                        ImpressiveLiked: metricsForClip.ImpressiveLiked,
                        ImpressiveCount: metricsForClip.ImpressiveCount,
                        FunnyLiked: metricsForClip.FunnyLiked,
                        FunnyCount: metricsForClip.FunnyCount,
                        DiscussionLiked: metricsForClip.DiscussionLiked,
                        DiscussionCount: metricsForClip.DiscussionCount,
                        ViewCount: metricsForClip.ViewCount,
                        LikeCount: metricsForClip.LikeCount,
                        CommentCount: commentsForClip.CommentCount,
                        Comments: commentsForClip.Comments,
                        Filters: filtersForClip
                    };

                    results.push(response);
                }

                resolve(results);
            }).catch(err => {
                let msg = "Failed to find clips for user " + username + ", " + err.message;
                logger.error(msg);
                reject(msg);
            });
        }).catch(err => {
            let msg = "Failed to find clips for user " + username + ", " + err.message;
            logger.error(msg);
            reject(msg);
        });
    });
}

// TODO possibly pass Title too for better error messages
function getAllClipsForGame(gameId) {
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

                let commentsForClip = getCommentsForClip(clip.ClipId);
                let metricsForClip = getMetricsForClip(clip.ClipId);
                let filtersForClip = getFiltersForClip(clip.ClipId);

                let response = {
                    ClipId: clip.ClipId,
                    Type: clip.Type,
                    PosterUserId: clip.PosterUserId,
                    VideoFilepath: clip.VideoFilepath,
                    Title: clip.Title,
                    GameId: clip.GameId,
                    Duration: clip.Duration,
                    DateCreated: clip.DateCreated,
                    Poster: clip.Poster,
                    ViewCount: clip.ViewCount,

                    Liked: metricsForClip.Liked,
                    UserImage: metricsForClip.UserImage,
                    BadgeOne: metricsForClip.BadgeOne,
                    BadgeTwo: metricsForClip.BadgeTwo,
                    BadgeThree: metricsForClip.BadgeThree,
                    BadgeFour: metricsForClip.BadgeFour,
                    ImpressiveLiked: metricsForClip.ImpressiveLiked,
                    ImpressiveCount: metricsForClip.ImpressiveCount,
                    FunnyLiked: metricsForClip.FunnyLiked,
                    FunnyCount: metricsForClip.FunnyCount,
                    DiscussionLiked: metricsForClip.DiscussionLiked,
                    DiscussionCount: metricsForClip.DiscussionCount,
                    ViewCount: metricsForClip.ViewCount,
                    LikeCount: metricsForClip.LikeCount,
                    CommentCount: commentsForClip.CommentCount,
                    Comments: commentsForClip.Comments,
                    Filters: filtersForClip
                };

                results.push(response);
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

// TODO fully implement me
function getMetricsForClip(clipId) {
    let response = {

        // FIXME need to get remaining params from somewhere?

        Liked: true,

        // ------------  Are these the same as what is from user above?
        UserImage: 'crown.png',
        BadgeOne: 'badge1.png',
        BadgeTwo: 'badge2.png',
        BadgeThree: 'badge3.png',
        BadgeFour: 'badge4.png',

        // ----------- Lets call these clip "metrics"
        ImpressiveLiked: true,
        ImpressiveCount: "70.9k",
        FunnyLiked: false,
        FunnyCount: "12.4k",
        DiscussionLiked: true,
        DiscussionCount: "30.6k",
        ViewCount: "8.64M",
        LikeCount: "1.21M",
    };

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