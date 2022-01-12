if(process.env.NODE_ENV!='production'){
    require('dotenv').config();
}

var mysql = require("mysql");

var connection = mysql.createConnection({
    host: process.env.HOST,
	port:process.env.DBPORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    timezone:"local",

});

connection.connect(function (err) {
	
    if (err) {
		console.log(err)
      	throw err;
    }

    console.log("connected!");
});

module.exports = connection;
