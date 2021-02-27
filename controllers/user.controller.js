const db = require("../models");
const User = db.user;
const moment = require("moment");
const logger = require("../utils/logger");
const dateUtil = require("../utils/dateUtil");

exports.users = (req, res) => {
    return res.status(200);
}

exports.getUser = (req, res) => {
    let userId = req.query.userId;

    if (!userId) {
        let msg = "Unable to get user, ID is undefined.";
        return res.status(400).send({ message: msg });
    }

    getOneUser(userId).then(user => {
        if (!user) {
            let msg = "User was not found.";
            return res.status(400).send({ message: msg });
        }

        let json = JSON.stringify(user);
        res.status(200).end(json);
    }).catch(err => {
        let msg = "Failed to find user, " + err.message;
        logger.warn(msg);
        return res.status(400).send({ message: msg });
    });
}

exports.getUsers = (req, res) => {
    getAllUsers().then(users => {
        if (!users || users.length < 1) {
            let msg = "No users were found.";
            return res.status(400).send({ message: msg });
        }

        let json = JSON.stringify(users);
        res.status(200).end(json);
    }).catch(err => {
        let msg = "Failed to find users, " + err.message;
        logger.warn(msg);
        return res.status(400).send({ message: msg });
    });
}

// Generates data for Browse, Profile, SingleClip, and SingleGame pages
exports.getUserProfileForClips = (req, res, next) => {
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
                let userId = results[i].UserId;

                getOneUser(userId).then(user => {
                    if (user) {
                        let userProfile = getUserProfile(user);
                        results[i].UserProfile = userProfile;
                    }

                    resolve();
                }).catch(err => {
                    let msg = "Failed to find user profile for user " + userId + ", " + err.message;
                    logger.warn(msg);
                });
            });
        }

        req.results = results;

        next();
    })();
}

function getOneUser(userId) {
    return new Promise(function (resolve, reject) {
        User.findOne({
            where: {
                UserId: userId
            }
        }).then(user => {
            if (!user) {
                let msg = "User was not found.";
                reject(msg);
                return;
            }

            let values = getUserValues(user);

            resolve(values);
        }).catch(err => {
            let msg = "Get user error, " + err.message;
            logger.error(msg);
            reject(msg);
        });
    });
}

function getAllUsers() {
    var result = [];

    return new Promise(function (resolve, reject) {
        User.findAll().then(users => {
            if (!users || users.length < 1) {
                let msg = "No users were found.";
                logger.warn(msg);
                reject(msg);
                return;
            }

            for (let index = 0; index < users.length; index++) {
                let user = users[index];
                let values = getUserValues(user);
                result.push(values);
            }

            resolve(result);
        }).catch(err => {
            let msg = "Failed to find users, " + err.message;
            logger.warn(msg);
            reject(msg);
        });
    });
}

function getUserValues(user) {
    let displayDate = dateUtil.getDisplayDbDate(user.DateCreated);

    let values = {
        UserId: user.UserId,
        Username: user.Username,
        Email: user.Email,
        DateCreated: user.DateCreated,
        DisplayDate: displayDate,
        IconFilepath: user.IconFilepath,
        Active: user.Active,
        Admin: user.Admin,
        Badges: user.Badges
    };

    return values;
}

function getUserProfile(user) {
    let badges = getBadgesForProfile(user.Badges);
    let userMetrics = getUserMetrics(user.UserId);
    let displayDate = dateUtil.getDisplayDbDate(user.DateCreated);

    let userProfile = {
        Username: user.Username,
        DateCreated: user.DateCreated,
        DisplayDate: displayDate,
        IconFilepath: user.IconFilepath,
        Badges: badges,
        Followed: userMetrics.Followed,
        FollowerCount: userMetrics.FollowerCount,
        ClipsCount: userMetrics.ClipsCount,
    };

    return userProfile;
}

// Assumes there will be 4 badges for clip
function getBadgesForProfile(userBadges) {
    let defaultBadge = "unknown.png";
    let badges = [defaultBadge, defaultBadge, defaultBadge, defaultBadge];

    if (userBadges) {
        for (let index = 0; index < userBadges.length; index++) {
            badges[index] = userBadges[index];
        }
    }

    let badgesForProfile = {
        BadgeOne: badges[0],
        BadgeTwo: badges[1],
        BadgeThree: badges[2],
        BadgeFour: badges[3]
    }

    return badgesForProfile;
}

// TODO fully implement me
function getUserMetrics(userId) {
    let response = {
        Followed: true,
        FollowerCount: "555M",
        ClipsCount: "777",
    };

    return response;
}