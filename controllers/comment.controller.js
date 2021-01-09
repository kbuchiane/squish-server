const db = require("../models");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");
const User = db.user;
const Clip = db.clip;
const Comment = db.comment;
const moment = require("moment");

exports.addComment = (req, res) => {
    let commenter = req.body.commenter;
    let clipId = req.body.clipId;
    let text = req.body.comment;
    let parentCommentId = req.body.parentCommentId;

    if (!commenter || !clipId || !text) {
        let msg = "Invalid request to comment on clip.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    // Get UserId of commenter
    User.findOne({
        where: {
            Username: commenter
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
