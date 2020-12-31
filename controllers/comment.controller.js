const db = require("../models");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");
const User = db.user;
const Clip = db.clip;
const Comment = db.comment;
const moment = require("moment");

exports.addComment = (req, res) => {
    let commenter = req.body.commenter;
    let clipTitle = req.body.clipTitle;
    let text = req.body.comment;
    let parentComment = req.body.parentComment;

    // console.log("Add comment  [" + commenter + "] [" + clipTitle + "] [" + text + "] [" + parentComment + "]");

    if (!commenter || !clipTitle || !text) {
        let msg = "Invalid request to comment on clip.  Please try again.";
        console.log(msg);
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
            console.log(msg);
            return res.status(400).send({ message: msg });
        }

        let commenterId = user.UserId;

        // Get ClipId
        Clip.findOne({
            where: {
                Title: clipTitle
            }
        }).then(clip => {
            if (!clip) {
                let msg = "Unable to add comment, clip " + clipTitle + " was not found.";
                console.log(msg);
                return res.status(400).send({ message: msg });
            }

            let clipId = clip.ClipId;

            // Get Parent CommentId (if one exists)
            Comment.findOne({
                where: {
                    Text: parentComment
                }
            }).then(comment => {
                let parentCommentId = null;

                if (comment) {
                    parentCommentId = comment.CommentId;  // Comment made by parent
                }

                // Add new comment
                let dateCreated = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);
                Comment.create({
                    UserId: commenterId,
                    Text: text,
                    DateCreated: dateCreated,
                    ClipId: clipId,
                    ParentCommentId: parentCommentId
                }).then(newComment => {
                    let msg = "Comment has been added:  " + text;
                    console.log(msg);
                    return res.status(200).send({ message: msg })
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
