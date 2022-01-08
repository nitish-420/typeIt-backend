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
});

connection.connect(function (err) {
	
    if (err) {
      	throw err;
		// console.log(err.message)
    }

    console.log("connected!");
});

module.exports = connection;
