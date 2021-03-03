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

    getOneUserForId(userId).then(user => {
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

// Currently called by browse.route - but not really used yet (actually like.controller will use UserId)
// Gets data for logged on user. The thought is that this date can be used anywhere in the workflow
exports.setLoggedOnUserData = (req, res, next) => {
    let useCache = req.useCache;
    let username = req.query.username;

    if (useCache) {
        next();
        return;
    }

    if (!username) {
        next();
        return;
     }    


  //  if (username) {
        getOneUserForName(username).then(user => {
            if (!user) {
                let msg = "Unable to set logged on user data. User was not found.";
                return res.status(400).send({ message: msg });
            }

            req.loggedOnUser = user;
            next();
        }).catch(err => {
            let msg = "Unable to set logged on user data. Failed to find user, " + err.message;
            logger.warn(msg);
        });
  //  }
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

                getOneUserForId(userId).then(user => {
                    if (user) {
                        let userProfile = getUserProfile(user);
                        let badges = getBadgesForUser(user.Badges);

                        results[i].UserProfile = userProfile;
                        results[i].UserImage = user.IconFilepath,
                        results[i].BadgeOne = badges.BadgeOne;
                        results[i].BadgeTwo = badges.BadgeTwo;
                        results[i].BadgeThree = badges.BadgeThree;
                        results[i].BadgeFour = badges.BadgeFour;
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

function getOneUserForId(userId) {
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


function getOneUserForName(username) {
    return new Promise(function (resolve, reject) {
        User.findOne({
            where: {
                Username: username
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
    let badges = getBadgesForUser(user.Badges);
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

// FIXME there could be 0-4 badges
//
// Assumes there will be 4 badges for clip
function getBadgesForUser(userBadges) {
    let defaultBadge = "unknown.png";  // TODO change to null/empty
    let badges = [defaultBadge, defaultBadge, defaultBadge, defaultBadge];

    if (userBadges) {
        for (let index = 0; index < userBadges.length; index++) {
            badges[index] = userBadges[index];
        }
    }

    let badgesForUser = {
        BadgeOne: badges[0],
        BadgeTwo: badges[1],
        BadgeThree: badges[2],
        BadgeFour: badges[3]
    }

    return badgesForUser;
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