const db = require("../models");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");
const User = db.user;
const Comment = db.comment;
const Clip = db.clip;
const Like = db.like;

exports.likeClip = (req, res) => {
    let liker = req.body.liker;
    let clipId = req.body.clipId;

    if (!liker || !clipId) {
        let msg = "Invalid LIKE request.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    // Get id of liker
    User.findOne({
        where: {
            Username: liker
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to add LIKE, user " + username + " was not found.";
            return res.status(400).send({ message: msg });
        }

        let userId = user.UserId;

        // Verify clip exists
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
    let liker = req.body.liker;
    let commentId = req.body.commentId;

    if (!liker || !commentId) {
        let msg = "Invalid LIKE request.  Please try again.";
        return res.status(400).send({ message: msg });
    }
    
    // Get id of liker
    User.findOne({
        where: {
            Username: liker
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
