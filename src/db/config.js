const mysql = require("mysql");
console.log("MYSQL Connection Ready...");
const query = (sql, args = []) => {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  const connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  //console.log("Database connection established.");
  connection.on("error", function () {
    console.log("Database error, reconnecting...");
  });

  return new Promise((resolve, reject) => {
    if (args.length > 0) {
      connection.query(sql, args, (err, res) => {
        if (err) resolve(err);
        resolve(res);
        connection.end();
        //console.log("Database connection closed.");
      });
    } else {
      connection.query(sql, (err, res) => {
        if (err) reject(err);
        resolve(res);
        connection.end();
        //console.log("Database connection closed.");
      });
    }
  });
};
module.exports = query;
