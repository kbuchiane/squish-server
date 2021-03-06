const db = require("../models");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");
const workflowUtil = require("../utils/workflowUtil");
const UserFollowing = db.userFollowing;
const User = db.user;
const GameFollowing = db.gameFollowing;
const Game = db.game;
const Op = db.Sequelize.Op;
const moment = require("moment");

exports.follows = (req, res) => {
    return res.status(200);
}

exports.followUser = (req, res) => {
    let followerUsername = req.body.followerUsername;
    let followedUsername = req.body.followedUsername;

    if (!followerUsername || !followedUsername) {
        return res.status(400).send({
            message: "Error. Please try again."
        });
    } else {
        User.findOne({
            where: {
                [Op.and]: [
                    { Username: followerUsername },
                    { Active: true }
                ]
            }
        }).then(user => {
            if (!user) {
                let msg = "User " + followerUsername + " is unknown. Please try again.";
                return res.status(400).send({ message: msg });
            }

            followerId = user.UserId;
            User.findOne({
                where: {
                    Username: followedUsername
                }
            }).then(user => {
                if (!user) {
                    return res.status(400).send({
                        message: "Unable to follow requested user, " + followedUsername + " is not available."
                    });
                }
                followedId = user.UserId;
                UserFollowing.findOne({
                    where: {
                        [Op.and]: [
                            { FollowerUserId: followerId },
                            { FollowedUserId: followedId }
                        ]
                    }
                }).then(user => {
                    let dateFollowed = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);
                    if (!user) {
                        UserFollowing.create({
                            FollowerUserId: followerId,
                            FollowedUserId: followedId,
                            DateFollowed: dateFollowed
                        }).then(userFollowing => {
                            return res.status(200);
                        }).catch(err => {
                            logger.error("Follow user error, " + err.message);
                            return res.status(500).send({
                                message: "Failed to follow user. Please try again."
                            });
                        });
                    } else {
                        let msg = "User " + followedUsername + " is already being followed."
                        return res.status(400).send({
                            message: msg
                        });
                    }
                }).catch(err => {
                    logger.error("Follow user error, " + err.message);
                    return res.status(400).send({
                        message: "Error. Please try again."
                    });
                });
            })
        })
    }
};

exports.followGame = (req, res) => {
    let followerUsername = req.body.followerUsername;
    let requestedGame = req.body.followedGame;

    if (!followerUsername || !requestedGame) {
        let msg = "Invalid request to follow game. Please try again.";
        return res.status(400).send({ message: msg });
    }

    User.findOne({
        where: {
            [Op.and]: [
                { Username: followerUsername },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "User " + followerUsername + " is unknown. Please try again.";
            return res.status(400).send({ message: msg });
        }

        let followerId = user.UserId;

        Game.findOne({
            where: {
                Title: requestedGame
            }
        }).then(game => {

            if (!game) {
                let msg = "Unable to follow requested game, " + requestedGame + " is not available.";
                return res.status(400).send({ message: msg });
            }

            let requestedGameId = game.GameId;
            GameFollowing.findOne({
                where: {
                    [Op.and]: [
                        { FollowerUserId: followerId },
                        { GameId: requestedGameId }
                    ]
                }
            }).then(gameFollowing => {
                if (!gameFollowing) {
                    let dateFollowed = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);

                    GameFollowing.create({
                        FollowerUserId: followerId,
                        GameId: requestedGameId,
                        DateFollowed: dateFollowed
                    }).then(gameFollowing => {
                        return res.status(200);
                    }).catch(err => {
                        let msg = "Follow game error, " + err.message;
                        logger.error(msg);
                        return res.status(500).send({
                            message: msg
                        });
                    });
                } else {
                    let msg = "Game " + requestedGame + " is already being followed."
                    return res.status(400).send({ message: msg });
                }
            }).catch(err => {
                let msg = "Unable to follow game " + requestedGame + ", " + err.message;
                logger.error(msg);
                return res.status(400).send({ message: msg });
            });
        })
    })
};

exports.unfollowGame = (req, res) => {
    let followerUsername = req.body.username;
    let gameFollowingId = req.body.gameFollowingId;

    if (!followerUsername || !gameFollowingId) {
        let msg = "Invalid request to unfollow game. Please try again.";
        return res.status(400).send({ message: msg });
    }

    User.findOne({
        where: {
            [Op.and]: [
                { Username: followerUsername },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "User " + followerUsername + " is unknown. Please try again.";
            return res.status(400).send({ message: msg });
        }

        let followerId = user.UserId;

        // Only allow origial follower to delete gameFollowing record
        GameFollowing.findOne({
            where: {
                [Op.and]: [
                    { GameFollowingId: gameFollowingId },
                    { FollowerUserId: followerId }
                ]
            }
        }).then(gameFollowing => {
            if (!gameFollowing) {
                let msg = "Did not find record, Unable to unfollow requested game";
                return res.status(400).send({ message: msg });
            }

            GameFollowing.destroy({
                where: {
                    GameFollowingId: gameFollowingId
                }
            }).then(like => {
                return res.status(200);
            }).catch(err => {
                let msg = "Unable to delete GameFollowing, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        }).catch(err => {
            let msg = "Search for GameFollowing failed, " + err.message;
            logger.error(msg);
            return res.status(400).send({ message: msg });
        });
    })
};

exports.unfollowUser = (req, res) => {
    let followerUsername = req.body.username;
    let userFollowingId = req.body.userFollowingId;

    if (!followerUsername || !userFollowingId) {
        let msg = "Invalid request to unfollow user. Please try again.";
        return res.status(400).send({ message: msg });
    }

    User.findOne({
        where: {
            [Op.and]: [
                { Username: followerUsername },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "User " + followerUsername + " is unknown. Please try again.";
            return res.status(400).send({ message: msg });
        }

        let followerId = user.UserId;

        // Only allow origial follower to delete userFollowing record
        UserFollowing.findOne({
            where: {
                [Op.and]: [
                    { UserFollowingId: userFollowingId },
                    { FollowerUserId: followerId }
                ]
            }
        }).then(userFollowing => {
            if (!userFollowing) {
                let msg = "Did not find record, Unable to unfollow requested user";
                return res.status(400).send({ message: msg });
            }

            UserFollowing.destroy({
                where: {
                    UserFollowingId: userFollowingId
                }
            }).then(like => {
                return res.status(200);
            }).catch(err => {
                let msg = "Unable to delete UserFollowing, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        }).catch(err => {
            let msg = "Search for UserFollowing failed, " + err.message;
            logger.error(msg);
            return res.status(400).send({ message: msg });
        });
    })
};

// Generates data for Browse, BrowseGames, and Profile pages
exports.getGamesFollowedByUser = (req, res, next) => {
    let readOnlyView = req.readOnlyView;
    let username = req.query.username;
    let results = [];
    let useCache = req.useCache;

    if (useCache) {
        next();
        return;
    }

    if (readOnlyView) {
        // requested by non logged in user
        next();
        return;
    }

    // Get results from previous steps
    results = req.results;

    // Get list of gameIds that this user follows
    getGamesFollowedByUser(username).then(gamesFollowed => {
        for (let index = 0; index < results.length; index++) {
            let gameId = results[index].GameId;

            if (gamesFollowed.includes(gameId)) {
                results[index].Followed = true;
            }
        }

        req.results = results;

        next();
    }).catch(err => {
        let msg = "Failed to find games followed by user, " + err.message;
        logger.warn(msg);
        return res.status(400).send({ message: msg });
    });
}

// Generates data for Browse, BrowseGames, and Profile pages
exports.getGameFollowerCount = (req, res, next) => {
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
        // Get follower count for each game  
        for (let index = 0; index < results.length; index++) {
            await new Promise(resolve => {
                let gameId = results[index].Game.GameId;
                let count = 0;

                getGameFollowerCount(gameId).then(gameFollowerCount => {
                    if (gameFollowerCount) {
                        count = gameFollowerCount;
                    }
                    results[index].Game.FollowerCount = count;


                    resolve();
                }).catch(err => {
                    let msg = "Failed to find game follower count for game " + gameId + ", " + err.message;
                    logger.warn(msg);
                    // currently no reject
                });
            });
        }
        next();
    })();
}

// Generates data for Profile pages
exports.getUserFollowerCount = (req, res, next) => {
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
        // Get follower count for each user  
        for (let index = 0; index < results.length; index++) {
            await new Promise(resolve => {
                let userId = results[index].UserProfile.UserId;
                let count = 0;
                getUserFollowerCount(userId).then(userFollowerCount => {
                    if (userFollowerCount) {
                        count = userFollowerCount;
                    }
                    results[index].UserProfile.FollowerCount = count;
                    resolve();
                }).catch(err => {
                    let msg = "Failed to get user follower count for user " + userId + ", " + err.message;
                    logger.warn(msg);
                    // currently no reject
                });
            });
        }
        next();
    })();
}

// Sets Followed field in UserProfile, which is TRUE if current logged in user follows profile user
// Generates data for Profile page
exports.getUserFollowingForUser = (req, res, next) => {
    let useCache = req.useCache;
    let loggedOnUser = workflowUtil.getValue(workflowUtil.LOGGED_ON_USER_KEY, req.workflow);

    if (useCache) {
        next();
        return;
    }

    if (!loggedOnUser) {
        next();
        return;
    }

    // Start with results from previous steps
    let results = req.results;

    (async function loop() {
        for (let i = 0; i < results.length; i++) {
            await new Promise(resolve => {
                let followerUserId = loggedOnUser.UserId;
                let followedUserId = results[i].UserId;

                getUserFollowingForUser(followerUserId, followedUserId).then(followed => {
                    results[i].UserProfile.Followed = followed;
                    resolve();
                }).catch(err => {
                    let msg = "Failed to find follows for user " + followedUserId + ", " + err.message;
                    logger.warn(msg);
                });
            });
        }

        req.results = results;

        next();
    })();
}

function getUserFollowingForUser(followerUserId, followedUserId) {
    return new Promise(function (resolve, reject) {
        if (!followerUserId || !followedUserId) {
            let msg = "Unable to get UserFollowing for user, passed in parameters are invalid.";
            logger.warn(msg);
            resolve(false);
            return;
        }

        UserFollowing.findOne({
            where: {
                [Op.and]: [
                    { FollowerUserId: followerUserId },
                    { FollowedUserId: followedUserId }
                ]
            }
        }).then(userFollowing => {
            if (userFollowing) {
                resolve(true);
                return;
            }

            resolve(false);
        }).catch(err => {
            let msg = "Search for UserFollowing failed, " + err.message;
            logger.error(msg);
            reject(msg);
        });
    });
}


// Returns a list of GameId's
function getGamesFollowedByUser(username) {
    var results = [];

    return new Promise(function (resolve, reject) {
        if (!username) {
            let msg = "Search for games followed by user failed, username is null.";
            logger.warn(msg);
            reject(msg);
        }

        User.findOne({
            where: {
                [Op.and]: [
                    { Username: username },
                    { Active: true }
                ]
            }
        }).then(user => {
            if (!user) {
                let msg = "Search for games followed by user failed, user " + username + " is unknown.";
                logger.warn(msg);
                reject(msg);
            }

            let followerId = user.UserId;

            GameFollowing.findAll({
                where: {
                    FollowerUserId: followerId
                }
            }).then(gameFollowings => {
                if (gameFollowings) {
                    gameFollowings.forEach(gameFollowing => {
                        results.push(gameFollowing.GameId);
                    });
                }

                resolve(results);
            }).catch(err => {
                let msg = "Search for games followed by user failed, " + err.message;
                logger.error(msg);
                reject(msg);
            });
        })
    });
}

// Returns number of followers for game
function getGameFollowerCount(gameId) {
    var count = 0;

    return new Promise(function (resolve, reject) {
        if (!gameId) {
            let msg = "Unable to get game follower count, gameId is null.";
            logger.warn(msg);
            reject(msg);
        }

        Game.findOne({
            where: {
                GameId: gameId
            }
        }).then(game => {
            if (!game) {
                let msg = "Unable to get game follower count, failed to find gameId.";
                logger.warn(msg);
                reject(msg);
            }

            GameFollowing.findAll({
                where: {
                    GameId: gameId
                }
            }).then(gameFollowings => {
                if (gameFollowings) {
                    count = gameFollowings.length;
                }

                resolve(count);
            }).catch(err => {
                let msg = "Search for games followed by user failed, " + err.message;
                logger.error(msg);
                reject(msg);
            });
        })
    });
}


// Returns number of followers for user
function getUserFollowerCount(userId) {
    var count = 0;

    return new Promise(function (resolve, reject) {
        if (!userId) {
            let msg = "Unable to get user follower count, userId is null.";
            logger.warn(msg);
            reject(msg);
        }

        User.findOne({
            where: {
                UserId: userId
            }
        }).then(user => {
            if (!user) {
                let msg = "Unable to get user follower count, failed to find userId.";
                logger.warn(msg);
                reject(msg);
            }

            UserFollowing.findAll({
                where: {
                    FollowedUserId: userId
                }
            }).then(userFollowings => {
                if (userFollowings) {
                    count = userFollowings.length;
                }

                resolve(count);
            }).catch(err => {
                let msg = "Search for users following user failed, " + err.message;
                logger.error(msg);
                reject(msg);
            });
        })
    });
}