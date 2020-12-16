const db = require("../models");
const authConfig = require("../config/auth.config");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");

const UserFollowing = db.userFollowing;
const User = db.user;
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