const db = require("../models");
const logger = require("../utils/logger");
const fs = require("fs");
const appConfig = require("../config/app.config");
const moment = require("moment");

const User = db.user;
const Clip = db.clip;
const Game = db.game;

/*
Should eventually do file metadata processing to prevent users from accidentally 
(or intentionally and perhaps maliciously) uploading the same file many times.
Currently we don't perform any check, so a video can be uploaded many times over.
If you're testing this, make sure you occasionally clean out the local destination 
directory or this will fill up your disk.

This doesn't currently perform the intended functionality.  Right now all this 
does is copy a file from the local file system to a new directory and make the 
database calls needed to store and construct unique file paths for each user.

This code will need to be updated with video streaming functionality once later 
architectural and dependency decisions are made. We will want the user's clip to 
be streamed incrementally to the server, be fault tolerant, and be able to save 
the video that's being loaded into memory onto disk once the upload is complete. 
Since we want this to be as easy for users as possible, we'll probably want the 
solution that will result in the least amount of processing time for the user/ 
client in order to free up their browser. I did some light research into this, 
but didn't immediately find anything that stood out as fitting our needs.

Ideas:
-Compress file on client side so that transfer is faster. Can you even compress 
a video file? Is it faster?
-How does Youtube uploading work? How fast is it?
-There are other things that have to happen after a video is uploaded before it 
can be viewed. What are those things?

File copy drops file extension. Video/thumbnail are still viewable, but throw 
warning when trying to view.
*/

exports.postClip = (req, res) => {
    let title = req.body.title;
    let game = req.body.game;
    let username = req.body.user;
    let video = req.body.video;
    let thumbnail = req.body.thumbnail;

    if (!video) {
        let msg = "Please select a clip to upload";
        return res.status(400).send({ message: msg });
    } else if (!thumbnail) {
        let msg = "Please select a thumbnail to upload";
        return res.status(400).send({ message: msg });
    } else if (!title) {
        let msg = "Please enter a title for the clip";
        return res.status(400).send({ message: msg });
    } else if (title.length > 80) {
        let msg = "The clip title must be 80 characters or less";
        return res.status(400).send({ message: msg });
    } else if (!game) {
        let msg = "Please enter a game for the clip";
        return res.status(400).send({ message: msg });
    } else if (game.length > 50) {
        let msg = "The game must be 80 characters or less";
        return res.status(400).send({ message: msg });
    } else if (!username) {
        let msg = "You must be logged in to post a clip";
        return res.status(400).send({ message: msg });
    }

    // TODO: Find duration of video file from the file's metadata
    let duration = req.body.duration;

    if (!duration) {
        let msg = "The duration of the uploaded clip could not be determined. Please try again.";
        return res.status(400).send({ message: msg });
    } else if (duration > 30) {
        let msg = "The duration of the uploaded clip must be 30 seconds or less. Please try again.";
        return res.status(400).send({ message: msg });
    }

    let dateCreated = moment(Date.now()).format(appConfig.DB_DATE_FORMAT);

    User.findOne({
        where: {
            [Op.and]: [
                { Username: username },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to add comment, user " + commenter + " was not found.";
            return res.status(400).send({ message: msg });
        }

        let posterId = user.UserId;
        Game.findOne({
            where: {
                Title: game
            }
        }).then(game => {
            if (!game) {
                let msg = "Unable to find game " + game + ".";
                return res.status(400).send({ message: msg });
            }
            let gameId = game.GameId;
            Clip.create({
                PosterUserId: posterId,
                Title: title,
                GameId: gameId,
                Duration: duration,
                DateCreated: dateCreated,
                ViewCount: 0
            }).then(clip => {
                let clipId = clip.ClipId;
                let videoFilePath = username + "/" + clipId;
                let thumbnailFilePath = username + "/" + clipId + "-thumbnail";
                Clip.update({
                    VideoFilepath: videoFilePath,
                    ThumbnailFilepath: thumbnailFilePath
                },
                    {
                        where: {
                            ClipId: clipId
                        }
                    }).then(clip => {
                        let relativeClipPath = "./clips/" + videoFilePath;
                        let relativeThumbnailPath = "./clips/" + thumbnailFilePath;

                        fs.stat("./clips/" + username, function (error, stats) {
                            if (stats == null) {
                                fs.mkdir("./clips/" + username, error => {
                                    if (error) {
                                        logger.error(error);
                                        throw (error);
                                    }
                                });
                            }
                            fs.copyFile("../squish-client/src/assets/videos/snipe1.mp4", relativeClipPath, error => {
                                if (error) {
                                    logger.error(error);
                                    throw (error);
                                }
                            });
                            fs.copyFile("../squish-client/src/assets/images/snipe1poster.png", relativeThumbnailPath, error => {
                                if (error) {
                                    logger.error(error);
                                    throw (error);
                                }
                            });
                        })

                        return res.status(200).send();
                    }).catch(err => {
                        let msg = "Add clip error, " + err.message;
                        logger.error(msg);
                        return res.status(400).send({
                            message: msg
                        });
                    });

                return res.status(200);
            }).catch(err => {
                let msg = "Add clip error, " + err.message;
                logger.error(msg);
                return res.status(400).send({
                    message: msg
                });
            });
        }).catch(err => {
            let msg = "Add clip error, " + err.message;
            logger.error(msg);
            return res.status(400).send({
                message: msg
            });
        });
    });
}

exports.deleteClip = (req, res) => {
    let username = req.body.user;
    let clipId = req.body.clipId;

    Clip.findOne({
        where: {
            VideoFilepath: username + "/" + clipId
        }
    }).then(clip => {
        if (!clip) {
            let msg = "Unable to delete clip. Clip was not found.";
            return res.status(400).send({ message: msg });
        }
        if (!clip.ClipId) {
            let msg = "Invalid delete request. Please try again.";
            return res.status(400).send({ message: msg });
        }
        Clip.destroy({
            where: {
                ClipId: clipId
            }
        }).then(clip => {
            fs.stat("./clips/" + username + "/" + clipId, function (error, stats) {
                if (stats != null) {
                    fs.unlink("./clips/" + username + "/" + clipId, error => {
                        if (error) {
                            logger.error("Failed to delete clip from local disk");
                        }
                    });
                }
            });
            fs.stat("./clips/" + username + "/" + clipId + "-thumbnail", function (error, stats) {
                console.log("thumnail exists");
                if (stats != null) {
                    fs.unlink("./clips/" + username + "/" + clipId + "-thumbnail", error => {
                        console.log("thumbnail deleted");
                        if (error) {
                            logger.error("Failed to delete thumbnail from local disk");
                        }
                    });
                }
            });
            return res.status(200).send();
        }).catch(err => {
            let msg = "Delete clip error, " + err.message;
            logger.error(msg);
            return res.status(500).send({
                message: msg
            });
        });
    });
}