const db = require("../models");
const logger = require("../utils/logger");
const User = db.user;
const Comment = db.comment;
const LikeComment = db.likeComment;
const Op = db.Sequelize.Op;

exports.likeComment = (req, res) => {
    return res.status(200);
}

// TODO needs to be retested - change so params are in req.query
exports.likeComment = (req, res) => {
    let liker = req.body.username;
    let type = req.body.type;
    let commentId = req.body.commentId;

    if (!liker || !type || !commentId) {
        let msg = "Invalid likeComment request. Please try again.";
        return res.status(400).send({ message: msg });
    }

    if (!checkType(type)) {
        let msg = "Invalid likeComment type. Please try again.";
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
            let msg = "Unable to add likeComment, user " + username + " was not found.";
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
                let msg = "Unable to add likeComment, comment was not found.";
                return res.status(400).send({ message: msg });
            }

            // Add new comment LIKE
            LikeComment.create({
                Type: type,
                CommentId: commentId,
                UserId: userId
            }).then(like => {
                return res.status(200);
            }).catch(err => {
                let msg = "Add likeComment error, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        })
    })
};

// TODO needs to be retested - change so params are in req.query
exports.unlikeComment = (req, res) => {
    // User not needed for unliking but keep around for auditing purposes
    let unliker = req.body.username;
    let likeId = req.body.likeId;

    if (!unliker || !likeId) {
        let msg = "Invalid unLike comment request. Please try again.";
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
            let msg = "Unable to remove likeComment, user " + username + " was not found.";
            return res.status(400).send({ message: msg });
        }

        // Verify like exists
        LikeComment.findOne({
            where: {
                LikeId: likeId
            }
        }).then(like => {
            if (!like) {
                let msg = "LikeComment not found, unable to remove.";
                return res.status(400).send({ message: msg });
            }

            if (!like.CommentId) {
                let msg = "Invalid unLike comment request. Please try again.";
                return res.status(400).send({ message: msg });
            }

            Like.destroy({
                where: {
                    LikeId: likeId
                }
            }).then(like => {
                return res.status(200);
            }).catch(err => {
                let msg = "Delete likeComment error, " + err.message;
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
    LikeComment.rawAttributes.Type.values.forEach(element => {
        if (type == element) {
            found = true;
        }
    });

    return found;
}