var mysql = require('mysql');
//require('dotenv').config();


/**
var con = mysql.createConnection({
    host: fetch(process.env.DB_HOST),
    user: fetch(process.env.DB_USER),
    password: fetch(process.env.DB_PASSWORD)
  });
*/

//**


//*/

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

  
