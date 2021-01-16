const dbConfig = require("../config/db.config");
const Sequelize = require("sequelize");
const cron = require("node-cron");
const logger = require("../utils/logger");
var moment = require('moment');

const sequelize = new Sequelize(
    dbConfig.TESTDB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host: dbConfig.HOST,
        dialect: dbConfig.dialect,
        operatorsAliases: "false",
        logging: false
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model")(sequelize, Sequelize);
db.userFollowing = require("./userFollowing.model")(sequelize, Sequelize);
db.game = require("./game.model")(sequelize, Sequelize);
db.gameFollowing = require("./gameFollowing.model")(sequelize, Sequelize);
db.refreshToken = require("./refreshToken.model")(sequelize, Sequelize);
db.clip = require("./clip.model")(sequelize, Sequelize);
db.comment = require("./comment.model")(sequelize, Sequelize);
db.like = require("./like.model")(sequelize, Sequelize);

const Op = db.Sequelize.Op;

cron.schedule('* * * * * *', () => {
    db.user.findAll({
        where: {
            Active: false
        }
    }).then(users => {
        for(i in users) {
            user = users[i];
            userDateCreated = user.dataValues.DateCreated;
            
            var startDate = moment(userDateCreated, 'ddd MMM DD YYYY HH:mm:ss GMT-0400 (Eastern Daylight Time)');
            var endDate = moment(Date.now());
            var secondsDiff = endDate.diff(startDate, 'seconds');
            if(secondsDiff > 1800) {
                db.user.destroy({
                    where: {
                        UserId: user.dataValues.UserId
                    }
                }).then(user => {
                    logger.warn("Removed unconfirmed user from database.");
                }).catch(err => {
                    logger.error(err);
                });
            }
        }
    }).catch(err => {
        logger.error(err);
    });
});

module.exports = db;