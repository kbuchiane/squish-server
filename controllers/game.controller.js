const db = require("../models");
const User = db.user;
const Game = db.game;
const moment = require("moment");
const logger = require("../utils/logger");

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
    
    console.log("addGame  " + title + "  " + iconFilepath + "  " + username);

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

        // Probably want to add check for administrative user (not everyone should be able to add a game)

        let userId = user.UserId;

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
            return res.status(400).send({
                message: msg
            });
        });
    }).catch(err => {
        let msg = "Add game error, " + err.message;
        logger.error(msg);
        return res.status(400).send({
            message: msg
        });
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

        // Probably want to add check for administrative user (not everyone should be able to delete a game)

        let userId = user.UserId;

        Game.destroy({
            GameId: gameId
        }).then(game => {
            return res.status(200);
        }).catch(err => {
            let msg = "Delete game error, " + err.message;
            logger.error(msg);
            return res.status(400).send({
                message: msg
            });
        });
    }).catch(err => {
        let msg = "Delete game error, " + err.message;
        logger.error(msg);
        return res.status(400).send({
            message: msg
        });
    });
}

exports.getGame = (req, res) => {
    var url = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log("URL: " + url);
 
    let gameId = req.query.gameId;

    if (!gameId) {
        let msg = "Unable to get game, ID is undefined.";
        return res.status(400).send({ message: msg });
    }

    Game.findOne({
        where: {
            GameId: gameId
        }
    }).then(game => {
        if (!game) {
            let msg = "Game was not found.";
            return res.status(400).send({ message: msg });
        }

        var result = [];

        response = {
            GameId: game.GameId,
            Title: game.Title,
            IconFilepath: game.IconFilepath,
            ReleaseDate: game.ReleaseDate,
            Tags: game.Tags
        }; 

        result.push(response);

        let json = JSON.stringify(result);

        // TODO remove debug
        console.log(result);
        console.log(json);
        console.log("Is JSON? " + isJson(json));

        res.status(200).end(json);
    });
}

exports.getGames = (req, res) => {
    getAllGames().then(games => {
        if (!games || games.length < 1) {
            let msg = "No games were found.";
            return res.status(400).send({ message: msg });
        }

        let json = JSON.stringify(games);

        // TODO remove debug
        console.log(games);
        console.log(json);
        console.log("Is JSON? " + isJson(json));
        res.status(200).end(json);

    }).catch(err => {
        let msg = "Failed to find games, " + err.message;
        logger.warn(msg);

        return res.status(400).send({ message: msg });
    });
}

// Generates data for browseGames page
exports.browseGamesPage = (req, res, next) => {
    let readOnlyView = req.readOnlyView;
    let username = req.query.username;
    let useCache = req.useCache;
    let results = [];

    console.log("** Step 5 ** games.controller.browseGamesPage user [" + username + "]  useCache [" + useCache + "]  readOnly [" + readOnlyView + "]"); 

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

            let response = {
                GameId: game.GameId,
                Title: game.Title,
                IconFilepath: game.IconFilepath,
                ReleaseDate: game.ReleaseDate,
                Tags: game.Tags,

                // Set to default values - will be updated later in the workflow
                Followed: false,
                FollowerCount: "0",
                ClipsTodayCount: "0",
                ClipsAllTimeCount: "0"
            }

            results.push(response);
        }

        req.results = results;

        next();
    }).catch(err => {
        let msg = "Failed to find games, " + err.message;
        logger.warn(msg);

        return res.status(400).send({ message: msg });
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
            }              
                for (let index = 0; index < games.length; index++) {
                    let game = games[index];
    
                    let response = {
                        GameId: game.GameId,
                        Title: game.Title,
                        IconFilepath: game.IconFilepath,
                        ReleaseDate: game.ReleaseDate,
                        Tags: game.Tags
                    };
    
                    result.push(response);
                }            
    
            resolve(result);                      
        })
        .catch(err => {
            let msg = "Failed to find games, " + err.message;
                logger.warn(msg);
                reject(msg);
          });  
    });
}

// TODO move to utility
function isJson(value) {
    try {
      let json = JSON.parse(value);
      return true;
  
    } catch (e) {
      console.log("Value is not JSON");
      return false;
    }
  }