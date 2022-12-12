var mysql = require('mysql'); // newer library called mysql2 UPGRADE
require('dotenv').config();


//**
var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: fetch(process.env.DB_USER),
    password: fetch(process.env.DB_PASSWORD)
  });
//*/

//**


//*/

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

  
