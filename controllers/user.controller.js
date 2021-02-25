const db = require("../models");
const User = db.user;
const moment = require("moment");
const logger = require("../utils/logger");
const dateUtil = require("../utils/dateUtil");
const { urlencoded } = require("body-parser");
const { user } = require("../models");

exports.users = (req, res) => {
    return res.status(200);
}

exports.getUser = (req, res) => {
    var url = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log("URL: " + url);

    let userId = req.query.userId;

    if (!userId) {
        let msg = "Unable to get user, ID is undefined.";
        return res.status(400).send({ message: msg });
    }

    User.findOne({
        where: {
            UserId: userId
        }
    }).then(user => {
        if (!user) {
            let msg = "User was not found.";
            return res.status(400).send({ message: msg });
        }

        var result = [];
        let displayDate = dateUtil.getDisplayDbDate(user.DateCreated);

        response = {
            UserId: user.UserId,
            Username: user.username,
            Email: user.Email,
            DateCreated: user.DateCreated,
            DisplayDate: displayDate,
            IconFilepath: user.IconFilepath,
            Active: user.Active,
            Admin: user.Admin,
            Badges: user.Badges
        };

        result.push(response);

        let json = JSON.stringify(result);

        res.status(200).end(json);
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
    let readOnlyView = req.readOnlyView;
    let username = req.query.username;
    let profileName = req.query.profileName;
    let useCache = req.useCache;

    if (useCache) {
        next();
        return;
    }

    // Previously generated results from previous steps
    let results = req.results;

    (async function loop() {
        for (let i = 0; i < results.length; i++) {
            await new Promise(resolve => {
                let userId = results[i].PosterUserId;

                getUser(userId).then(user => {
                    if (user) {
                        let badges = getBadgesForProfile(user.Badges);
                        let displayDate = dateUtil.getDisplayDbDate(user.DateCreated);
                        let userProfile = {
                            Username: user.Username,
                            DateCreated: user.DateCreated,
                            DisplayDate: displayDate,
                            IconFilepath: user.IconFilepath,

                            // FIXME:  Next 3 are hard-coded
                            Followed: true,
                            FollowerCount: "555M",
                            ClipsCount: "777",
                            Badges: badges
                        };

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

function getUser(userId) {
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
            let displayDate = dateUtil.getDisplayDbDate(user.DateCreated);
            let response = {
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

            resolve(response);
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
                let displayDate = dateUtil.getDisplayDbDate(user.DateCreated);
                let response = {
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

                result.push(response);
            }

            resolve(result);
        })
            .catch(err => {
                let msg = "Failed to find users, " + err.message;
                logger.warn(msg);
                reject(msg);
            });
    });
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

    let badgesForClip = {
        BadgeOne: badges[0],
        BadgeTwo: badges[1],
        BadgeThree: badges[2],
        BadgeFour: badges[3]
    }

    return badgesForClip;
}