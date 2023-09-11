const Sequelize = require("sequelize");
// const dotenv = require("dotenv");

// dotenv.config();

const { DB_NAME, DB_PASSWORD, DB_USER, DB_URI, DB_HOST, DB_PORT } = process.env;

// connect to db locally
const db = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  dialect: "postgres",
  host: DB_HOST,
  port: DB_PORT,
});
module.exports = db;
