const db = require("../models");
const logger = require("../utils/logger");
const clipUtil = require("../utils/clipUtil");
const workflowUtil = require("../utils/workflowUtil");
const User = db.user;
const Clip = db.clip;
const LikeClip = db.likeClip;
const Op = db.Sequelize.Op;

exports.likeClip = (req, res) => {
    return res.status(200);
}

// TODO needs to be retested - change so params are in req.query
exports.likeClip = (req, res) => {
    let liker = req.body.username;
    let type = req.body.type;
    let clipId = req.body.clipId;

    if (!liker || !type || !clipId) {
        let msg = "Invalid LIKE request. Please try again.";
        return res.status(400).send({ message: msg });
    }

    if (!clipUtil.checkType(type)) {
        let msg = "Invalid LIKE type. Please try again.";
        return res.status(400).send({ message: msg });
    }

    // Get id of liker
    User.findOne({
        where: {
            [Op.and]: [
                { Username: liker },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to add LIKE, user " + username + " was not found.";
            return res.status(400).send({ message: msg });
        }

        let userId = user.UserId;

        // Verify clipId exists
        Clip.findOne({
            where: {
                ClipId: clipId
            }
        }).then(clip => {
            if (!clip) {
                let msg = "Unable to add LIKE, clip was not found.";
                return res.status(400).send({ message: msg });
            }

            // Add new clip LIKE
            Like.create({
                Type: type,
                ClipId: clipId,
                UserId: userId
            }).then(like => {
                return res.status(200);
            }).catch(err => {
                let msg = "Add clip LIKE error, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        })
    })
};

// TODO needs to be retested - change so params are in req.query
exports.unlikeClip = (req, res) => {
    // User not needed for unliking but keep around for auditing purposes
    let unliker = req.body.username;
    let likeId = req.body.likeId;

    if (!unliker || !likeId) {
        let msg = "Invalid unLIKE clip request. Please try again.";
        return res.status(400).send({ message: msg });
    }

    // Get id of unliker
    User.findOne({
        where: {
            [Op.and]: [
                { Username: unliker },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to remove LIKE clip, user " + username + " was not found.";
            return res.status(400).send({ message: msg });
        }

        // Verify like exists
        Like.findOne({
            where: {
                LikeId: likeId
            }
        }).then(like => {
            if (!like) {
                let msg = "LIKE clip not found, unable to remove.";
                return res.status(400).send({ message: msg });
            }

            if (!like.ClipId) {
                let msg = "Invalid unLIKE clip request. Please try again.";
                return res.status(400).send({ message: msg });
            }

            Like.destroy({
                where: {
                    LikeId: likeId
                }
            }).then(like => {
                return res.status(200);
            }).catch(err => {
                let msg = "Delete LIKE clip error, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        })
    })
};


// Generates data for Browse, SingleClip pages
exports.getUserLikesForClips = (req, res, next) => {
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
                let userId = loggedOnUser.UserId;
                getLikesForUser(userId).then(likeClip => {

                    if (likeClip) {
                        let liked = clipUtil.hasType(clipUtil.LikeClipType.Like, likeClip.Types);
                        let impressive = clipUtil.hasType(clipUtil.LikeClipType.Impressive, likeClip.Types);
                        let funny = clipUtil.hasType(clipUtil.LikeClipType.Funny, likeClip.Types);
                        let discussion = clipUtil.hasType(clipUtil.LikeClipType.Discussion, likeClip.Types);

                        results[i].Liked = liked;
                        results[i].ImpressiveLiked = impressive;
                        results[i].FunnyLiked = funny;
                        results[i].DiscussionLiked = discussion;
                    }

                    resolve();
                }).catch(err => {
                    let msg = "Failed to find likeClips for user " + userId + ", " + err.message;
                    logger.warn(msg);
                });
            });
        }

        req.results = results;

        next();
    })();
}

// This is data that we should possibly cache and only update peridically, mabye via a cron
exports.getLikeCountsForClips = (req, res, next) => {
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
                let clipId = results[i].ClipId;

                getLikesForClip(clipId).then(likes => {
                    let likeCount = 0;
                    let impressiveCount = 0;
                    let funnyCount = 0;
                    let discussionCount = 0;

                    if (likes && likes.length > 0) {

                        likeCount = clipUtil.getLikesCount(clipUtil.LikeClipType.Like, likes);
                        impressiveCount = clipUtil.getLikesCount(clipUtil.LikeClipType.Impressive, likes);
                        funnyCount = clipUtil.getLikesCount(clipUtil.LikeClipType.Funny, likes);
                        discussionCount = clipUtil.getLikesCount(clipUtil.LikeClipType.Discussion, likes);
                    }

                    results[i].LikeCount = likeCount;
                    results[i].ImpressiveCount = impressiveCount;
                    results[i].FunnyCount = funnyCount;
                    results[i].DiscussionCount = discussionCount;

                    resolve();
                }).catch(err => {
                    let msg = "Failed to find likes count for clip " + clipId + ", " + err.message;
                    logger.warn(msg);
                });
            });
        }

        req.results = results;

        next();
    })();
}

// Note: Caller must check response for no likes
function getLikesForUser(userId) {
    return new Promise(function (resolve, reject) {
        LikeClip.findOne({
            where: {
                UserId: userId
            }
        }).then(likeClip => {
            resolve(likeClip);
        }).catch(err => {
            let msg = "Get likeClips for user error, " + err.message;
            logger.error(msg);
            reject(msg);
        });
    });
}

// Note: Caller must check response for no likes
function getLikesForClip(clipId) {
    return new Promise(function (resolve, reject) {

        LikeClip.findAll({
            where: {
                ClipId: clipId
            }
        }).then(likes => {
            resolve(likes);
        }).catch(err => {
            let msg = "Get likeClips for clip error, " + err.message;
            logger.error(msg);
            reject(msg);
        });
    });
}