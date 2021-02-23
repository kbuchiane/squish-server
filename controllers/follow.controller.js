const db = require("../models");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");
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

    // Previously generated results from previous steps
    let results = req.results;

    // Get follower count for each game  
    for (let index = 0; index < results.length; index++) {
        let gameId = results[index].GameId;

        getGameFollowerCount(gameId).then(gameFollowerCount => {
            results[index].FollowerCount = gameFollowerCount;
        }).catch(err => {
            let msg = "Failed to find game follower count for game " + gameId + ", " + err.message;
            logger.warn(msg);
            // continue getting follower counts
        });
    }

    req.results = results;

    next();
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

        // TODO may make sense to make a new table with all the different totals

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