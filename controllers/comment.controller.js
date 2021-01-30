const db = require("../models");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");
const User = db.user;
const Clip = db.clip;
const Comment = db.comment;
const Op = db.Sequelize.Op;
const moment = require("moment");

exports.comments = (req, res) => {
    return res.status(200);
}

exports.addComment = (req, res) => {
    let commenter = req.body.commenter;
    let clipId = req.body.clipId;
    let text = req.body.text;
    let parentCommentId = req.body.parentCommentId;

    if (!commenter || !clipId || !text) {
        let msg = "Invalid request to comment on clip. Please try again.";
        return res.status(400).send({ message: msg });
    }

    // Get UserId of commenter
    User.findOne({
        where: {
            [Op.and]: [
                { Username: commenter },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to add comment, user " + commenter + " was not found.";
            return res.status(400).send({ message: msg });
        }

        let commenterId = user.UserId;

        // Get ClipId
        Clip.findOne({
            where: {
                ClipId: clipId
            }
        }).then(clip => {
            if (!clip) {
                let msg = "Unable to add comment, clip was not found.";
                return res.status(400).send({ message: msg });
            }

            // Get Parent comment (if one exists)
            let foundParentCommentId = null;

            if (!parentCommentId) {
                // Query doesn't like null values in where clause. Expect NOT to find parentCommentId
                parentCommentId = -1;
            }

            Comment.findOne({
                where: {
                    CommentId: parentCommentId
                }
            }).then(comment => {
                if (comment) {
                    foundParentCommentId = comment.CommentId;
                }

                // Add new comment
                let dateCreated = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);
                Comment.create({
                    UserId: commenterId,
                    Text: text,
                    DateCreated: dateCreated,
                    ClipId: clipId,
                    ParentCommentId: foundParentCommentId
                }).then(newComment => {
                    return res.status(200);
                }).catch(err => {
                    let msg = "Add comment error, " + err.message;
                    logger.error(msg);
                    return res.status(500).send({
                        message: msg
                    });
                });
            })
        })
    })
};

exports.deleteComment = (req, res) => {
    let commenter = req.body.commenter;
    let commentId = req.body.commentId;

    if (!commenter || !commentId) {
        let msg = "Unable to delete comment. Please try again.";
        return res.status(400).send({ message: msg });
    }

    // Get UserId of commenter
    User.findOne({
        where: {
            [Op.and]: [
                { Username: commenter },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to delete comment, user " + commenter + " was not found.";
            return res.status(400).send({ message: msg });
        }

        let commenterId = user.UserId;

        // Get CommentId
        Comment.findOne({
            where: {
                CommentId: commentId
            }
        }).then(comment => {
            if (!comment) {
                let msg = "Unable to delete, comment was not found.";
                return res.status(400).send({ message: msg });
            }

            if (comment.UserId != commenterId) {
                let msg = "Unable to delete, comment was not created by " + commenter;
                return res.status(400).send({ message: msg });
            }

            // NOTE: delete does not adjust child comments whose parent is the comment to be deleted

            // Delete comment
            comment.destroy({
                where: {
                    CommentId: commentId
                }
            }).then(deleteComment => {
                return res.status(200);
            }).catch(err => {
                let msg = "Delete comment error, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        })
    })
};