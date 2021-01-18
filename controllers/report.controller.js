const db = require("../models");
const appConfig = require("../config/app.config");
const logger = require("../utils/logger");
const User = db.user;
const Comment = db.comment;
const Clip = db.clip;
const Report = db.report;
const Op = db.Sequelize.Op;
const moment = require("moment");

exports.reports = (req, res) => {
    return res.status(200);
}

exports.reportClip = (req, res) => {
    let reporter = req.body.username;
    let clipId = req.body.clipId;
    let reason = req.body.reason;
    let text = req.body.text;

    if (!reporter || !clipId || !reason || !text) {
        let msg = "Invalid REPORT request.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    if (!checkReason(reason)) {
        let msg = "Invalid REPORT reason.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    // Get id of reporter
    User.findOne({
        where: {
            [Op.and]: [
                { Username: reporter },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to add REPORT, user " + reporter + " was not found.";
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
                let msg = "Unable to add REPORT, clip was not found.";               
                return res.status(400).send({ message: msg });
            }

            // Add new clip REPORT
            let dateCreated = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);
            Report.create({
                ReporterId: userId,
                Reason: reason,
                Text: text,
                DateCreated: dateCreated,
                Resolved: '0',
                DateResolved: null,
                ClipId: clipId,
                CommentId: null
            }).then(report => {
                return res.status(200);
            }).catch(err => {
                let msg = "Add clip REPORT error, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        })
    })
};

exports.reportComment = (req, res) => {
    let reporter = req.body.username;
    let commentId = req.body.commentId;
    let reason = req.body.reason;
    let text = req.body.text;

    if (!reporter || !commentId || !reason || !text) {
        let msg = "Invalid REPORT request.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    if (!checkReason(reason)) {
        let msg = "Invalid REPORT reason.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    // Get id of reporter
    User.findOne({
        where: {
            [Op.and]: [
                { Username: reporter },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to add REPORT, user " + reporter + " was not found.";
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
                let msg = "Unable to add REPORT, comment was not found.";
                return res.status(400).send({ message: msg });
            }

            // Add new comment REPORT
            let dateCreated = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);
            Report.create({
                ReporterId: userId,
                Reason: reason,
                Text: text,
                DateCreated: dateCreated,
                Resolved: '0',
                DateResolved: null,
                ClipId: null,
                CommentId: commentId
            }).then(report => {
                return res.status(200);
            }).catch(err => {
                let msg = "Add comment REASON error, " + err.message;
                logger.error(msg);
                return res.status(500).send({
                    message: msg
                });
            });
        })
    })
};

function checkReason(reason) {
    let found = false;
    Report.rawAttributes.Reason.values.forEach(element => {
        if (reason == element) {
            found = true;
        }
    });

    return found;
}