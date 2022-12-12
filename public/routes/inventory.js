// // import { Sequelize, Model, DataTypes } from 'sequelize';

// // const sequelize = new Sequelize('sqlite::memory:');
// // var Sequelize = require('sequelize');

// // const User = sequelize.define('User', {
// //   username: DataTypes.STRING,
// //   birthday: DataTypes.DATE,
// // });

// // module.exports = function(sequelize, DataTypes) {
// //     var Spreadsheets
// // }

// // const { Sequelize, Op, Model, DataTypes } = require("sequelize");

// // const { Sequelize } = require('sequelize');

// // // Option 1: Passing a connection URI
// // const sequelize = new Sequelize('sqlite::memory:') // Example for sqlite
// // const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname') // Example for postgres

// // // Option 2: Passing parameters separately (sqlite)
// // const sequelize = new Sequelize({
// //   dialect: 'sqlite',
// //   storage: 'path/to/database.sqlite'
// // });

// // // Option 3: Passing parameters separately (other dialects)
// // const sequelize = new Sequelize('database', 'username', 'password', {
// //   host: 'localhost',
// //   dialect: /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
// // });


// const dbConfig = require("../db/db_connection.js");

// const Sequelize = require("Sequelize");
// const Sequelize = new Sequelize(dbCofig.DB, dbConfig.USER,
// dbConfig.PASSWORD, {
// 	host: dbConfig.HOST,
// 	dialect: dbConfig.dialect,
// 	operationsAliases: false,
// 	pool: {
// 	max: dbConfig.pool.max,
// 	min: dbConfig.pool.min,
// 	acquire: dbConfig.pool.acquire,
// 	idle: dbConfig.pool.idle
// 	}
// };
// const db = {};

// db.Sequelize = Sequelize;
// db.sequelize = sequelize;

// db.tutorials = require("./tutorial.model.js") (sequelize, Sequelize);

// module.exports = db;
// // The user should not forget to summon the sync() method in the server.js.
// const app = express();
// app.use(....);

// const db = require("./app/models");
// db.sequelize.sync();


// // https://www.turing.com/kb/mysql-connection-with-node-js-using-sequelize-and-express