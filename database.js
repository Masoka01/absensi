const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  timezone: "+07:00"
});

module.exports = pool;
