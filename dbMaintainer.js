const bcrypt = require("bcryptjs");
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
var testUserEmail = 'testUser@MyTest.com';
var testUserPassword = '$2a$10$jXWVrWoWDLRW5TJDNcrI7O/2QU5m9ViKymIHFgVqBk/6dH.UsuR7u'; // equates to changeme

let platform = 'TEST';
let forceSync = false;
let dbName = dbConfig.TESTDB;
let dbNameMatch = '/_test$/';
let modelsPath = "./models/";

let clipData = [
    {
        PosterUserId: '1', VideoFilepath: '/home/games/Frogger.jpeg', Title: 'Frogger Greatest Hits', GameId: '1',
        Duration: '5', DateCreated: '12/29/2020', ThumbnailFilepath: '/tmp/Frogger.thm', ViewCount: '6'
    },
    {
        PosterUserId: '2', VideoFilepath: '/home/games/AstroFire.jpeg', Title: 'AstroFire Clasics', GameId: '2',
        Duration: '44', DateCreated: '12/31/2020', ThumbnailFilepath: '/tmp/AstroFire.thm', ViewCount: '55'
    }
];

let commentData = [
    {
        UserId: '1', Text: 'Frogger is such a classic', DateCreated: '12/29/2020', ClipId: '1', ParentCommentId: null
    },
    {
        UserId: '2', Text: 'Give this a try', DateCreated: '12/31/2020', ClipId: '2', ParentCommentId: null
    }
];

let gameData = [
    {
        Title: 'Frogger', IconFilepath: '/home/games/frogger.icon'
    },
    {
        Title: 'AstroFire', IconFilepath: '/home/games/astrofire.icon'
    }
];

let userData = [
    {
        Username: 'Freddy', Email: testUserEmail, Password: testUserPassword, DateCreated: '7/7/1982',
        IconFilepath: '/home/users/freddy/Freddy.ico', Active: '1', RefreshToken: null, RefreshTokenExpiration: null,
        ConfirmId: null, ConfirmIdDateCreated: null, VerifyAttemptCount: '0', Admin: '0'
    },
    {
        Username: 'Andy', Email: testUserEmail, Password: testUserPassword, DateCreated: '8/21/1978',
        IconFilepath: '/home/users/andy/Andy.ico', Active: '1', RefreshToken: null, RefreshTokenExpiration: null,
        ConfirmId: null, ConfirmIdDateCreated: null, VerifyAttemptCount: '0', Admin: '0'
    }
];

console.log('\n');
console.log('***  \x1b[32m%s\x1b[0m  ***', 'Squish');
console.log('Database Maintainer');

if (argv._.includes('build')) {
    name = prompt('Enter database administrator name: ');
    console.log('Enter password');
    pw = prompt({ echo: '*' });

    if (argv.production) {
        let answer = prompt('Updating the PRODUCTION database.  Are you sure? ');
        let answerLower = answer.toLowerCase();

        if (answerLower == "yes" || answerLower == "y") {
            platform = 'PRODUCTION';
        }
    }

    initialize();
    startMaintainer();
}

function dropTables() {
    let answer = prompt('Dropping tables.  Are you sure? ');
    let answerLower = answer.toLowerCase();

    if (answerLower == "yes" || answerLower == "y") {
        forceSync = true;
    }
}

function checkDataValues() {
    let answer = prompt('Test users will be added to the User table. Would you like to use an operational email account for them? ');
    let answerLower = answer.toLowerCase();
    if (answerLower == "yes" || answerLower == "y") {
        testUserEmail = prompt('Enter valid email address: ');      
        userData.forEach(element => {
            element.Email = testUserEmail;
        });
    }

    answer = prompt('The test user\'s password will default to \"changeme\". Would you like to use a different password? ');
    answerLower = answer.toLowerCase();
    if (answerLower == "yes" || answerLower == "y") {
        console.log('Enter NEW password');
        let answer2 = prompt({ echo: '*' });
        let salt = bcrypt.genSaltSync(10);
        testUserPassword = bcrypt.hashSync(answer2, salt);
        userData.forEach(element => {
            element.Password = testUserPassword;
        });
    }
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

        if (argv.load) {
            checkDataValues();
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
        if (argv.load) {
            db.clip.bulkCreate(clipData);
            console.log(green(clipData.length + ' rows added to Clip'));
        }
    });

    // Comment
    db.comment.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('Comment'));
        if (argv.load) {
            db.comment.bulkCreate(commentData);
            console.log(green(commentData.length + ' rows added to Comment'));
        }
    });

    // Game
    db.game.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('Game'));
        if (argv.load) {
            db.game.bulkCreate(gameData)
            console.log(green(gameData.length + ' rows added to Game'));
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
        if (argv.load) {
            db.user.bulkCreate(userData);
            console.log(green(userData.length + ' rows added to User'));
        }
    });

    // UserFollowing
    db.userFollowing.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('UserFollowing'));
    });
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