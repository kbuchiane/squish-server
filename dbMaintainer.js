const yargs = require('yargs');
const prompt = require('prompt-sync')();
const dbConfig = require("./config/db.config");
const Sequelize = require("sequelize");
const argv = yargs
    .command('build', 'Build schema in database', {
    })
    .option('drop', {
        alias: 'd',
        description: 'Force drop tables before loading schema',
        type: 'boolean',
    })
    .option('load', {
        alias: 'l',
        description: 'Load tables with entries',
        type: 'boolean',
    })
    .option('production', {
        alias: 'p',
        description: 'Use the PRODUCTION database, defaults to TEST',
        type: 'boolean',
    })
    .demandCommand().recommendCommands().strict()
    .help()
    .alias('help', 'h')
    .argv;

var sequelize = null;
var db = null;
var name = "";
var pw = "";

let platform = 'TEST';
let forceSync = false;
let dbName = dbConfig.TESTDB;
let dbNameMatch = '/_test$/';
let modelsPath = "./models/";

console.log('\n');
console.log('***  \x1b[32m%s\x1b[0m  ***', 'Squish');
console.log('Database Maintainer');

if (argv._.includes('build')) {
    name = prompt('Enter name: ');
    console.log('Enter password');
    pw = prompt({ echo: '*' });

    if (argv.production) {
        let ans1 = prompt('Updating the PRODUCTION database.  Are you sure? ');
        let ans1Lower = ans1.toLowerCase();

        if (ans1Lower == "yes" || ans1Lower == "y") {
            platform = 'PRODUCTION';
        }
    }

    initialize();
    startMaintainer();
}

function dropTables() {
    let ans1 = prompt('Dropping tables.  Are you sure? ');
    let ans1Lower = ans1.toLowerCase();

    if (ans1Lower == "yes" || ans1Lower == "y") {
        forceSync = true;
    }
}

function red(s) {
    return '\033[31m' + s;
}

function green(s) {
    return '\033[32m' + s;
}

function yellow(s) {
    return '\033[33m' + s;
}

function initialize() {
    console.log("Initializing sequelize")

    if (platform == "PRODUCTION") {
        dbName = dbConfig.DB;
        dbNameMatch = 'squish';
        forceSync = false;
    }

    sequelize = new Sequelize(
        dbName,
        name,
        pw,
        {
            host: dbConfig.HOST,
            dialect: dbConfig.dialect,
            operatorsAliases: "false",
            logging: false
        }
    );

    db = {};

    db.Sequelize = Sequelize;
    db.sequelize = sequelize;
}

async function startMaintainer() {
    console.log("Checking the database connection")

    try {
        await sequelize.authenticate();
        configureModels();

        if (argv.drop) {

            dropTables();
        }

        syncAndLoadTables();
    } catch (error) {
        console.log(red("Problem connecting to the database"));
    }
}

function configureModels() {
    console.log('Configuring models');

    db.clip = require(modelsPath + "clip.model")(sequelize, Sequelize);
    db.comment = require(modelsPath + "comment.model")(sequelize, Sequelize);
    db.game = require(modelsPath + "game.model")(sequelize, Sequelize);
    db.gameFollowing = require(modelsPath + "gameFollowing.model")(sequelize, Sequelize);
    db.like = require(modelsPath + "like.model")(sequelize, Sequelize);
    db.refreshToken = require(modelsPath + "refreshToken.model")(sequelize, Sequelize);
    db.user = require(modelsPath + "user.model")(sequelize, Sequelize);
    db.userFollowing = require(modelsPath + "userFollowing.model")(sequelize, Sequelize);
}

function syncAndLoadTables() {
    console.log('Sync and load tables: ');

    // Clip
    db.clip.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('Clip'));
    });

    // Comment
    db.comment.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('Comment'));
    });

    // Game
    db.game.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        if (argv.load) {
            db.game.bulkCreate([
                { Title: 'Frogger', IconFilepath: '/home/games/frogger.icon' },
                { Title: 'AstroFire', IconFilepath: '/home/games/astrofire.icon' }])
            console.log(yellow('Game'));
        }
    });

    // GameFollowing
    db.gameFollowing.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('GameFollowing'));
    });

    // Like
    db.like.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('Like'));
    });

    // RefreshToken
    db.refreshToken.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('RefreshToken'));
    });

    //User
    db.user.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('User'));
    });

    // UserFollowing
    db.userFollowing.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('UserFollowing'));
    });
}