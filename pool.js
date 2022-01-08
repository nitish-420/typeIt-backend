const util = require('util');
if (process.env.NODE_ENV != "production") {
  	require("dotenv").config();
}

var mysql = require("mysql");

var pool = mysql.createPool({
	host: process.env.HOST,
	port: process.env.DBPORT,
	user: process.env.USER,
	password: process.env.PASSWORD,
	database: process.env.DATABASE,
	// multipleStatements: true,
	connectionLimit:process.env.CONNECTIONPOOLLIMIT,
	timezone:"local",
	debug:false,

});

pool.getConnection((err, connection) => {
	if (err) {
		if (err.code === "PROTOCOL_CONNECTION_LOST") {
		console.error("Database connection was closed.");
		}
		if (err.code === "ER_CON_COUNT_ERROR") {
		console.error("Database has too many connections.");
		}
		if (err.code === "ECONNREFUSED") {
		console.error("Database connection was refused.");
		}
	}

	if (connection) connection.release();

	return;
});

// Promisify for Node.js async/await.
pool.query = util.promisify(pool.query)


module.exports = pool