var express = require('express');
var db = require('../../db/db_connection');

var router = express.Router();




router.get("/inventory", (req, res) => {
    db.execute(read_inventory_all_sql, (error, results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error
      else {
        res.render('inventory', { results: results });
      }
    });
  });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: ' Home Page ',
                        style: 'index.css'});
});


module.exports = router;