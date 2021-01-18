const db = require("../models");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");
const User = db.user;
const Comment = db.comment;
const Clip = db.clip;
const Like = db.like;
const Op = db.Sequelize.Op;

exports.likes = (req, res) => {
    return res.status(200);
}

exports.likeClip = (req, res) => {
    let liker = req.body.username;
    let type = req.body.type;
    let clipId = req.body.clipId;

    if (!liker || !type || !clipId) {
        let msg = "Invalid LIKE request.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    if (!checkType(type)) {
        let msg = "Invalid LIKE type.  Please try again.";
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
                CommentId: null,
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

exports.likeComment = (req, res) => {
    let liker = req.body.username;
    let type = req.body.type;
    let commentId = req.body.commentId;

    if (!liker || !type || !commentId) {
        let msg = "Invalid LIKE request.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    if (!checkType(type)) {
        let msg = "Invalid LIKE type.  Please try again.";
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

        // Verify comment exists
        Comment.findOne({
            where: {
                CommentId: commentId
            }
        }).then(comment => {
            if (!comment) {
                let msg = "Unable to add LIKE, comment was not found.";
                return res.status(400).send({ message: msg });
            }

            // Add new comment LIKE
            Like.create({
                Type: type,
                ClipId: null,
                CommentId: commentId,
                UserId: userId
            }).then(like => {
                return res.status(200);
            }).catch(err => {
                let msg = "Add comment LIKE error, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        })
    })
};

exports.unlikeClip = (req, res) => {
    // User not needed for unliking but keep around for auditing purposes
    let unliker = req.body.username;
    let likeId = req.body.likeId;

    if (!unliker || !likeId) {
        let msg = "Invalid unLIKE request.  Please try again.";
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
            let msg = "Unable to remove LIKE, user " + username + " was not found.";
            return res.status(400).send({ message: msg });
        }

        // Verify like exists
        Like.findOne({
            where: {
                LikeId: likeId
            }
        }).then(like => {
            if (!like) {
                let msg = "LIKE not found, unable to remove.";
                return res.status(400).send({ message: msg });
            }

            if (!like.ClipId) {
                let msg = "Invalid unLIKE request.  Please try again.";
                return res.status(400).send({ message: msg });
            }

            Like.destroy({
                where: {
                    LikeId: likeId
                }
            }).then(like => {
                return res.status(200);
            }).catch(err => {
                let msg = "Delete LIKE comment error, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        })
    })
};

exports.unlikeComment = (req, res) => {
    // User not needed for unliking but keep around for auditing purposes
    let unliker = req.body.username;
    let likeId = req.body.likeId;

    if (!unliker || !likeId) {
        let msg = "Invalid unLIKE request.  Please try again.";
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
            let msg = "Unable to remove LIKE, user " + username + " was not found.";
            return res.status(400).send({ message: msg });
        }

        // Verify like exists
        Like.findOne({
            where: {
                LikeId: likeId
            }
        }).then(like => {
            if (!like) {
                let msg = "LIKE not found, unable to remove.";
                return res.status(400).send({ message: msg });
            }

            if (!like.CommentId) {
                let msg = "Invalid unLIKE request.  Please try again.";
                return res.status(400).send({ message: msg });
            }

            Like.destroy({
                where: {
                    LikeId: likeId
                }
            }).then(like => {
                return res.status(200);
            }).catch(err => {
                let msg = "Delete LIKE comment error, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        })
    })
};

function checkType(type) {
    let found = false;
    Like.rawAttributes.Type.values.forEach(element => {
        if (type == element) {
            found = true;
        }
    });

    return found;
}