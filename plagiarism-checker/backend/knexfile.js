require('dotenv').config();

module.exports = {
	development: {
		client: "mysql2",
		connection: {
			host: "localhost",
			user: "root",
			password: "@Auzan1234",
			database: "seoplagiarismchecker",
		},
		migrations: {
			directory: "./migrations",
		},
	},
	staging: {
		client: "mysql2",
		connection: {
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
		},
		migrations: {
			directory: "./migrations",
		},
	},
};
