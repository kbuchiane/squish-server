const db = require("../models");
const User = db.user;
const Game = db.game;
const logger = require("../utils/logger");
const dateUtil = require("../utils/dateUtil")

exports.games = (req, res) => {
    return res.status(200);
}

exports.addGame = (req, res) => {
    let title = req.body.title;
    let iconFilepath = req.body.iconFilepath;
    let username = req.body.user;
    let releaseDate = req.body.releaseDate;
    let tags = req.body.tags;

    if (!username) {
        let msg = "You must be logged in to post a game";
        return res.status(400).send({ message: msg });
    }
    else if (!iconFilepath) {
        let msg = "Please select an icon to upload";
        return res.status(400).send({ message: msg });
    } else if (!title) {
        let msg = "Please enter a title for the game";
        return res.status(400).send({ message: msg });
    } else if (title.length > 50) {
        let msg = "The game title must be 50 characters or less";
        return res.status(400).send({ message: msg });
    } else if (!releaseDate) {
        let msg = "Please enter a release date for the game";
        return res.status(400).send({ message: msg });
    } else if (!dateUtil.isDateValid(releaseDate)) {
        let msg = "Game release date format is incorrect.";
        return res.status(400).send({ message: msg });
    } else if (!tags) {
        let msg = "Please enter up to 2 game tags";
        return res.status(400).send({ message: msg });
    } else if (tags.length > 2) {
        let msg = "Games can have at most 2 tags";
        return res.status(400).send({ message: msg });
    }

    tags.forEach(tag => {
        if (tag.length > 20) {
            let msg = "Game tags must be 20 characters or less";
            return res.status(400).send({ message: msg });
        }
    });

    User.findOne({
        where: {
            [Op.and]: [
                { Username: username },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to add game, user " + username + " was not found.";
            return res.status(400).send({ message: msg });
        }

        // Add check for administrative user (not everyone should be able to add a game)

        Game.create({
            Title: title,
            IconFilepath: iconFilepath,
            ReleaseDate: releaseDate,
            Tags: tags
        }).then(game => {
            return res.status(200);
        }).catch(err => {
            let msg = "Add game error, " + err.message;
            logger.error(msg);
            return res.status(400).send({ message: msg });
        });
    }).catch(err => {
        let msg = "Add game error, " + err.message;
        logger.error(msg);
        return res.status(400).send({ message: msg });
    });
}

exports.deleteGame = (req, res) => {
    let gameId = req.body.gameId;
    let username = req.body.user;

    console.log("deleteGame  " + gameId + "  " + username);

    if (!username || !gameId) {
        let msg = "Invalid delete GAME request.  Please try again.";
        return res.status(400).send({ message: msg });
    }

    User.findOne({
        where: {
            [Op.and]: [
                { Username: username },
                { Active: true }
            ]
        }
    }).then(user => {
        if (!user) {
            let msg = "Unable to delete game, user " + username + " was not found.";
            return res.status(400).send({ message: msg });
        }

        // Add check for administrative user (not everyone should be able to delete a game)

        Game.destroy({
            GameId: gameId
        }).then(game => {
            return res.status(200);
        }).catch(err => {
            let msg = "Delete game error, " + err.message;
            logger.error(msg);
            return res.status(400).send({ message: msg });
        });
    }).catch(err => {
        let msg = "Delete game error, " + err.message;
        logger.error(msg);
        return res.status(400).send({ message: msg });
    });
}

exports.getGame = (req, res) => {
    let gameId = req.query.gameId;

    if (!gameId) {
        let msg = "Unable to get game, ID is undefined.";
        return res.status(400).send({ message: msg });
    }

    getOneGame(gameId).then(game => {
        if (!game) {
            let msg = "Game was not found.";
            return res.status(400).send({ message: msg });
        }

        let json = JSON.stringify(game);
        res.status(200).end(json);
    }).catch(err => {
        let msg = "Failed to find game, " + err.message;
        logger.warn(msg);
        return res.status(400).send({ message: msg });
    });
}

exports.getGames = (req, res) => {
    getAllGames().then(games => {
        if (!games || games.length < 1) {
            let msg = "No games were found.";
            return res.status(400).send({ message: msg });
        }

        let json = JSON.stringify(games);
        return res.status(200).end(json);
    }).catch(err => {
        let msg = "Failed to find games, " + err.message;
        logger.warn(msg);

        return res.status(400).send({ message: msg });
    });
}

// Generates data for Browse, BrowseGames, and Profile pages
exports.getGameData = (req, res, next) => {
    let useCache = req.useCache;

    if (useCache) {
        next();
        return;
    }

    // Previously generated results from previous steps
    let results = req.results;

    (async function loop() {
        for (let i = 0; i < results.length; i++) {
            await new Promise(resolve => {
                let gameId = results[i].GameId;

                getOneGame(gameId).then(game => {
                    let values = getGameValues(game);
                    results[i].Game = values;

                    resolve();
                }).catch(err => {
                    let msg = "Failed to find game for id " + gameId + ", " + err.message;
                    logger.warn(msg);
                });
            });
        }

        req.results = results;

        next();
    })();
}

// Generates data for browseGames page
exports.browseGamesPage = (req, res, next) => {
    let useCache = req.useCache;
    let results = [];

    if (useCache) {
        next();
        return;
    }

    getAllGames().then(games => {
        if (!games || games.length < 1) {
            let msg = "No games were found.";
            return res.status(400).send({ message: msg });
        }

        for (let index = 0; index < games.length; index++) {
            let game = games[index];
            let values = getGameValues(game);

            results.push(values);
        }

        req.results = results;

        next();
    }).catch(err => {
        let msg = "Failed to find games, " + err.message;
        logger.warn(msg);

        return res.status(400).send({ message: msg });
    });
}

function getOneGame(gameId) {
    return new Promise(function (resolve, reject) {
        Game.findOne({
            where: {
                GameId: gameId
            }
        }).then(game => {
            if (!game) {
                let msg = "Game was not found.";
                reject(msg);
                return;
            }

            let values = getGameValues(game);

            resolve(values);
        }).catch(err => {
            let msg = "Get game error, " + err.message;
            logger.error(msg);
            reject(msg);
        });
    });
}

function getAllGames() {
    var result = [];

    return new Promise(function (resolve, reject) {
        Game.findAll().then(games => {

            if (!games || games.length < 1) {
                let msg = "No games were found.";
                logger.warn(msg);
                reject(msg);
                return;
            }
            for (let index = 0; index < games.length; index++) {
                let game = games[index];
                let values = getGameValues(game);

                result.push(values);
            }

            resolve(result);
        }).catch(err => {
            let msg = "Failed to find games, " + err.message;
            logger.warn(msg);
            reject(msg);
        });
    });
}

function getGameValues(game) {
    let displayDate = dateUtil.getDisplayDateForFormat(game.ReleaseDate, dateUtil.GAME_DATE_FORMAT);

    let values = {
        GameId: game.GameId,
        Title: game.Title,
        IconFilepath: game.IconFilepath,
        ReleaseDate: game.ReleaseDate,
        DisplayDate: displayDate,
        Tags: game.Tags,

        // Use default values for the following - these will be updated in later workflow steps
        Followed: false,
        FollowerCount: "0",
        ClipsTodayCount: "0",
        ClipsAllTimeCount: "0"
    }

    return values;
}