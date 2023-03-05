var express = require('express');
var router = express.Router();
var db = require('../db/db_connection');

const fs = require('fs');
const path = require('path');

// let inventoryQuery = fs.readFileSync(path.join(__dirname, "db/select_inventory_all.sql"), "utf-8");
let inventoryQuery = fs.readFileSync("db/select_inventory_all.sql")


router.get('/', async function(req, res, next) {
  try {
    let results = await db.promise(inventoryQuery)
    console.log(results);
    res.render('inventory', { results: results });
  } catch (err) {
    next(err);
    console.log(err);
  }
 

});

// router.get("/inventory", (req, res) => {
//     db.execute(read_inventory_all_sql, (error, results) => {
//       if (error)
//         res.status(500).send(error); //Internal Server Error
//       else {
//         res.render('inventory', { results: results });
//       }
//     });
//   });

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: ' Home Page ',
//                         style: 'index.css'});
// });


module.exports = router;