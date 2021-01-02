const db = require("../models");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");
const User = db.user;
const Comment = db.comment;
const Like = db.like;
const moment = require("moment");

exports.addLike = (req, res) => {
    let username = req.body.liker;
    let commentId = req.body.commentId;

    if (!commenter || !commentId) {
        let msg = "Invalid request to LIKE comment.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    // Get UserId of username
    User.findOne({
        where: {
            Username: username
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to add LIKE, user " + username + " was not found.";
            return res.status(400).send({ message: msg });
        }

        // Get CommentId
        Comment.findOne({
            where: {
                CommentId: CommentId
            }
        }).then(comment => {
            if (!comment) {
                let msg = "Unable to add LIKE, comment was not found.";
                return res.status(400).send({ message: msg });
            }

            // Add new LIKE
            Like.create({
                ClipId: null,
                CommentId: commentId,
                UserId: userId
            }).then(newComment => {
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
