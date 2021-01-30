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
                        { GameFollowerUserId: followerId },
                        { FollowedGameId: requestedGameId }
                    ]
                }
            }).then(gameFollowing => {
                if (!gameFollowing) {
                    let dateFollowed = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);

                    GameFollowing.create({
                        GameFollowerUserId: followerId,
                        FollowedGameId: requestedGameId,
                        DateGameFollowed: dateFollowed
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
                    { GameFollowerUserId: followerId }
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
