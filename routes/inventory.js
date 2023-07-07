const express = require('express');
var router = express.Router();
const db = require("../db/inventory_queries.js");


router.get('/', (req, res, next) => {
  db.read_inventory_all_sql((error, results) => {
    if (error) 
      res.status(500).send(error); // Internal Server Error
    else {
      res.render('inventory', {
        results: results
      });
    }
  });
});


router.get("/:classifier_id", (req, res) => {
  let classifier_id = req.params.classifier_id;
  db.read_inventory_classifier_sql(classifier_id, (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error 
    else {
      res.render('inventory', {
        classifier_id: classifier_id,
        results: results
      });
    }
  });
});

router.get("/search/:input", (req, res) => {
  let input = req.params.input;
  let searchStr = `%${input}%`;
  db.read_inventory_search(searchStr, (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error 
    else {
      res.render('inventory', {
        input: input,
        results: results
      });
    }
  });
});

router.post("/inventoryformsubmit", async function (req, res, next) {
  db.insertIntoInventory(req.body.userInput1, req.body.userInput2, req.body.userInput3, req.body.userInput4, req.body.userInput5, req.body.userInput6,
    req.body.userInput7, req.body.userInput8, req.body.userInput10, req.body.userInput11, req.body.userInput12, (error, results) => {
      if (error) {
        res.redirect('/error');
      } else {
        res.redirect('/inventory');
      }
    });
});

router.post("/:ingredient_id/inventoryingredientupdate", async function (req, res, next) {
  let ingredient_id = req.params.ingredient_id;

  db.updateIngredient(req.body.userInput1, req.body.userInput2, req.body.userInput3, req.body.userInput4, req.body.userInput5, req.body.userInput6,
    req.body.userInput7, req.body.userInput8, req.body.userInput10, req.body.userInput11, req.body.userInput12, req.body.userInput13, ingredient_id, (error, results) => {
      if (error) {
        res.redirect("/error");
      } else {
        res.redirect('/inventory');
      }
    });
});



router.get("/archive-ingredient/:ingredient_id", (req, res) => {
  let ingredient_id = req.params.ingredient_id
  db.archiveIngredient(ingredient_id, (error, results) => {
    if (error)
      res.redirect("/error"); //Internal Server Error
    else
      res.redirect('/inventory');
  });
});





module.exports = router;