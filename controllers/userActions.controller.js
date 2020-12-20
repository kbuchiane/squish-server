const db = require("../models");
const authConfig = require("../config/auth.config");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");

const UserFollowing = db.userFollowing;
const User = db.user;
const GameFollowing = db.gameFollowing;
const Game = db.game;

const RefreshToken = db.refreshToken;
const Op = db.Sequelize.Op;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");

exports.followUser = (req, res) => {
    if (!req.body.followerUsername || !req.body.followedUsername) {
        return res.status(400).send({
            message: "Error. Please try again."
        });
    } else {
        let dateFollowed = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);
        User.findOne({
            where: {
                    username: req.body.followerUsername
            }
        }).then(user => {
            followerId = user.user_id;
            User.findOne({
                where: {
                        username: req.body.followedUsername
                }
            }).then(user => {
                if (!user) {              
                    return res.status(400).send({
                        message: "Unable to follow requested user, " + req.body.followedUsername + " is not available."
                    });
                }
                followedId = user.user_id;            
                UserFollowing.findOne({
                    where: {
                        [Op.and]: [
                            { follower_user_id: followerId },
                            { followed_user_id: followedId }
                        ]
                    }
                }).then(user => {
                    if (!user) {
                        UserFollowing.create({
                            follower_user_id: followerId,
                            followed_user_id: followedId,
                            date_followed: dateFollowed
                        }).then(userFollowing => {
                            return res.status(200).send({
                                message: "User followed!"                             
                            })
                        }).catch(err => {
                            logger.error("Follow user error, " + err.message);
                            return res.status(500).send({
                                message: "Failed to follow user. Please try again."
                            });
                        });
                    } else {
                        return res.status(400).send({
                            message: "You are already following this user."
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
        let msg = "Invalid request to follow game.  Please try again.";
        console.log(msg);
        return res.status(400).send({ message: msg });
    }

    User.findOne({
        where: {
            username: followerUsername
        }
    }).then(user => {
        let followerId = user.user_id;

        Game.findOne({
            where: {
                game_title: requestedGame
            }
        }).then(game => {

            if (!game) {
                let msg = "Unable to follow requested game, " + requestedGame + " is not available.";
                console.log(msg);
                return res.status(400).send({ message: msg });
            }

            let requestedGameId = game.game_id;
            GameFollowing.findOne({
                where: {
                    [Op.and]: [
                        { game_follower_user_id: followerId },
                        { followed_game_id: requestedGameId }
                    ]
                }
            }).then(gameFollowing => {
                if (!gameFollowing) {
                    let dateFollowed = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);

                    GameFollowing.create({
                        game_follower_user_id: followerId,
                        followed_game_id: requestedGameId,
                        date_game_followed: dateFollowed
                    }).then(gameFollowing => {
                        let msg = "Now following game " + requestedGame;
                        console.log(msg);
                        return res.status(200).send({ message: msg })
                    }).catch(err => {
                        let msg = "Follow game error, " + err.message;
                        logger.error(msg);
                        return res.status(500).send({
                            message: msg
                        });
                    });
                } else {
                    let msg = "Game " + requestedGame + " is already being followed."
                    console.log(msg);
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