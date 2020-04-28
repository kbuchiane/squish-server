var mysql = require('mysql');

// MySQL connector
var dbConn = mysql.createConnection({
    host: "localhost",
    user: process.env.db_username,
    password: process.env.db_password,
    database: "squish_schema"
});

dbConn.connect(function (err) {
    if (err) throw err;
    console.log("connected to database");
});

module.exports = dbConn;