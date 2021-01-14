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
    //  finally {
    //      // Gracefully close database
    //      console.log("DONE, closing DB now");
    //     sequelize.close();
    // }
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
    let msg = "";

    if (forceSync) {
       msg = "Drop, "
    }
    
    msg = msg + "Sync"

    if (argv.load) {
        msg = msg + ", Load";
    }

    msg = msg + " tables: ";

    console.log(msg);

    // Clip
    db.clip.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('Clip'));
        if (argv.load) {
            let json = loadData('clip.json');
            if (json) {
                db.clip.bulkCreate(json);
                console.log(green('Added ' + json.length + ' records to Clip'));
            }
        }
    });

    // Comment
    db.comment.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('Comment'));
        if (argv.load) {
            let json = loadData('comment.json');
            if (json) {
                db.comment.bulkCreate(json);
                console.log(green('Added ' + json.length + ' records to Comment'));
            }
        }
    });

    // Game
    db.game.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('Game'));
        if (argv.load) {
            let json = loadData('game.json');
            if (json) {
                db.game.bulkCreate(json)
                console.log(green('Added ' + json.length + ' records to Game'));
            }
        }
    });

    // GameFollowing
    db.gameFollowing.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('GameFollowing'));
        if (argv.load) {
            let json = loadData('gameFollowing.json');
            if (json) {
                db.gameFollowing.bulkCreate(json)
                console.log(green('Added ' + json.length + ' records to GameFollowing'));
            }
        }
    });

    // Like
    db.like.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('Like'));
        if (argv.load) {
            let json = loadData('like.json');
            if (json) {
                db.like.bulkCreate(json)
                console.log(green('Added ' + json.length + ' records to Like'));
            }
        }
    });

    // RefreshToken
    db.refreshToken.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('RefreshToken'));
        if (argv.load) {
            let json = loadData('refreshToken.json');
            if (json) {
                db.refreshToken.bulkCreate(json)
                console.log(green('Added ' + json.length + ' records to RefreshToken'));
            }
        }
    });

    //User
    db.user.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('User'));
        if (argv.load) {
            let json = loadData('user.json');
            if (json) {
                db.user.bulkCreate(json);
                console.log(green('Added ' + json.length + ' records to User'));
            }
        }
    });

    // UserFollowing
    db.userFollowing.sync({ force: forceSync, match: dbNameMatch }).then(() => {
        console.log(yellow('UserFollowing'));
        if (argv.load) {
            let json = loadData('userFollowing.json');
            if (json) {
                db.userFollowing.bulkCreate(json)
                console.log(green('Added ' + json.length + ' records to UserFollowing'));
            }
        }
    });
}

function loadData(fileName) {
    const fs = require('fs');
    let dataFilePath = __dirname + '/test/' + fileName;
    let json = null;
 
    try {
        if (fs.existsSync(dataFilePath)) {
            let data = fs.readFileSync(dataFilePath, 'utf8')
            json = JSON.parse(data);
        }
    } catch (err) {
        console.error(err)
    }

    return json;
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