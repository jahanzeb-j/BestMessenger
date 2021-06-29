const Sequelize = require("sequelize");

const db = new Sequelize("messenger", "postgres","admin", {
  host: "localhost",
  logging: true,
  dialect: "postgres",
});

module.exports = db;
