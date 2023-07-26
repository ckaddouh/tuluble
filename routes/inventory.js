const express = require('express');
var router = express.Router();
const db = require("../db/inventory_queries.js");


router.get('/', async function (req, res, next) {
  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });

  if (admin[0].admin === 1 || admin[0].admin === 2) {
    db.read_inventory_all_sql((error, results) => {
      if (error) 
        res.status(500).send(error); // Internal Server Error
      else {
        res.render('inventory', {
          results: results,
          isAdmin: admin[0].admin
        });
      }
    });
  }
  else {
    res.redirect("/index");
  }
});


router.get("/:classifier_id", async function (req, res, next) {
  let classifier_id = req.params.classifier_id;

  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });

  if (admin[0].admin === 1 || admin[0].admin === 2) {
  db.read_inventory_classifier_sql(classifier_id, (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error 
    else {
      res.render('inventory', {
        classifier_id: classifier_id,
        results: results,
        isAdmin: admin[0].admin
      });
    }
  });
  }
  else {
    res.redirect("/index");
  }
});

router.get("/search/:input", async function (req, res, next) {
  let input = req.params.input;
  let searchStr = `%${input}%`;

  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });

  if (admin[0].admin === 1 || admin[0].admin === 2) {
  db.read_inventory_search(searchStr,(error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error 
    else {
      res.render('inventory', {
        input: input,
        results: results,
        isAdmin: admin[0].admin
      });
    }
  });
  }
  else {
    res.redirect("/index");
  }
});

router.post("/inventoryformsubmit", async function (req, res, next) {
  const theSwitchValue = req.body.hazardousSwitch === 'on' ? 1 : 0;

  console.log("in func");
  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });

  console.log("admin check finished");

  if (admin[0].admin === 1 || admin[0].admin === 2) {
    console.log("hazardous submit");
    console.log(req.body.inci_name);
    console.log(req.body.trade_name);
    console.log(req.body.amt);
    console.log(req.body.shelf);
    console.log(req.body.classifier);
    console.log(req.body.lot_num);
    console.log(req.body.date_received);
    console.log(req.body.supplier);
    console.log(req.body.coa);
    console.log(req.body.msds);
    console.log(req.body.expiration);
    console.log(req.body.encoding);
    console.log(req.body.hazardDetails);


    db.insertIntoInventory(req.body.inci_name, req.body.trade_name, req.body.amt, req.body.shelf, req.body.classifier, req.body.lot_num,
      req.body.date_received, req.body.supplier, req.body.coa, req.body.msds, req.body.expiration, req.body.encoding, req.body.hazardDetails, (error, results) => {
        if (error) {
          console.log(error);
          res.redirect('/error');
        } else {
          res.redirect('/inventory');
        }
      });
  }
  else {
    res.redirect("/index");
  }
});


router.post("/:ingredient_id/inventoryingredientupdate", async function (req, res, next) {
  let ingredient_id = req.params.ingredient_id;

  db.updateIngredient(req.body.inci_name_edit, req.body.trade_name_edit, req.body.amt_edit, req.body.shelf_edit, req.body.classifier_edit, req.body.lot_num_edit,
    req.body.date_received_edit, req.body.supplier_edit, req.body.coa_edit, req.body.msds_edit, req.body.expiration_edit, req.body.cost_edit, req.body.hazardDetailsEdit, req.body.encoding_edit, ingredient_id, (error, results) => {
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