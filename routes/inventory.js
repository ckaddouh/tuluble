const express = require('express');
var router = express.Router();
const db = require("../db/inventory_queries.js");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { uploadFile, getFileStream } = require('../s3')
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)


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
    res.redirect("/");
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
    res.redirect("/");
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
    res.redirect("/");
  }
});

router.post("/inventoryformsubmit", upload.fields([{ name: 'newCOA', maxCount: 1 }, { name: 'newMSDS', maxCount: 1 }]), async function (req, res, next) {
  var coaPath;
  var msdsPath;

  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });

  if(req.files && req.files['newCOA'] && req.files['newCOA'].length > 0 && req.files['newMSDS'] && req.files['newMSDS'].length > 0) {
    const newCOAFile = req.files['newCOA'][0];
    const newMSDSFile = req.files['newMSDS'][0];

    const result1 = await uploadFile(newCOAFile);
    const result2 = await uploadFile(newMSDSFile);

    await unlinkFile(newCOAFile.path);
    await unlinkFile(newMSDSFile.path);

    coaPath = newCOAFile.path.substring(8);
    msdsPath = newMSDSFile.path.substring(8);
  }
  else if (req.files && req.files['newCOA'] && req.files['newCOA'].length > 0) {
    const newCOAFile = req.files['newCOA'][0];

    const result1 = await uploadFile(newCOAFile);

    await unlinkFile(newCOAFile.path);

    coaPath = newCOAFile.path.substring(8);
    msdsPath = "";
  }
  else if (req.files && req.files['newMSDS'] && req.files['newMSDS'].length > 0) {
    const newMSDSFile = req.files['newMSDS'][0];

    const result2 = await uploadFile(newMSDSFile);

    await unlinkFile(newMSDSFile.path);

    coaPath = "";
    msdsPath = newMSDSFile.path.substring(8);
  }
  else {
    coaPath = "";
    msdsPath = ""
  }

  const maxEncoding = await new Promise((resolve, reject) => {
    db.getMaxEncoding(req.body.newEncoding, (error, maxEncoding) => {
      if (error) reject (error);
      else resolve(maxEncoding);
    });
  });

  console.log(maxEncoding);

  let max = maxEncoding[0].max + 1; 

  
  let encoding = req.body.newEncoding + String(max).padStart(4, '0');

  if (admin[0].admin === 1 || admin[0].admin === 2) {
    db.insertIntoInventory(req.body.newInciName, req.body.newTradeName, req.body.newAmount, req.body.newShelf, req.body.newClassifier, req.body.newLotNum,
      req.body.newReceived, req.body.newSupplier, coaPath, msdsPath, req.body.newExpiration, encoding, req.body.hazardDetails, req.body.newCost, (error, results) => {
        if (error) {
          console.log(error);
          res.redirect('/error');
        } else {
          res.redirect('/inventory');
        }
      });
  }
  else {
    res.redirect("/");
  }
});


router.post("/:ingredient_id/inventoryingredientupdate", upload.fields([{ name: 'newCOAEdit', maxCount: 1 }, { name: 'newMSDSEdit', maxCount: 1 }]), async function (req, res, next) {
  let ingredient_id = req.params.ingredient_id;

  const oldEncoding = await new Promise((resolve, reject) => {
    db.getOldEncoding(ingredient_id, (error, oldEncoding) => {
      if (error) reject (error);
      else resolve(oldEncoding);
    });
  });


  console.log("ENCODING");
  console.log(oldEncoding[0].encoding); 
  console.log(req.body.editEncoding);
  let presetEncoding = req.body.editEncoding;
  

  if (!(oldEncoding[0].encoding) && presetEncoding) {
    console.log("in if statement");

    const maxEncoding = await new Promise((resolve, reject) => {
      db.getMaxEncoding(presetEncoding, (error, maxEncoding) => {
        if (error) reject (error);
        else resolve(maxEncoding);
      });
    });
    console.log("MAX ENCODING");
    console.log(maxEncoding);
  
    let max = maxEncoding[0].max + 1; 
  
    
    presetEncoding = req.body.editEncoding + String(max).padStart(4, '0');
  }

  if (!req.body.editEncoding)
    presetEncoding = "";

  console.log("NEW");
  console.log(presetEncoding);


  console.log('HELLO');
  console.log(req.files);

  var coaPath;
  var msdsPath;

  console.log("before file paths");
  const filePaths = await new Promise((resolve, reject) => {
    db.getExistingFilePaths(ingredient_id, (error, filePaths) => {
      if (error) reject (error);
      else resolve(filePaths);
    });
  });

  console.log("filePaths");
  console.log(filePaths);

  if(req.files && req.files['newCOAEdit'] && req.files['newCOAEdit'].length > 0 && req.files['newMSDSEdit'] && req.files['newMSDSEdit'].length > 0) {
    const newCOAFile = req.files['newCOAEdit'][0];
    const newMSDSFile = req.files['newMSDSEdit'][0];

    const result1 = await uploadFile(newCOAFile);
    const result2 = await uploadFile(newMSDSFile);

    await unlinkFile(newCOAFile.path);
    await unlinkFile(newMSDSFile.path);

    coaPath = newCOAFile.path.substring(8);
    msdsPath = newMSDSFile.path.substring(8);
  }
  else if (req.files && req.files['newCOAEdit'] && req.files['newCOAEdit'].length > 0) {
    const newCOAFile = req.files['newCOAEdit'][0];    
    const result1 = await uploadFile(newCOAFile);
    await unlinkFile(newCOAFile.path);

    coaPath = newCOAFile.path.substring(8);
    msdsPath = filePaths[0]['msds'];
  }
  else if (req.files && req.files['newMSDSEdit'] && req.files['newMSDSEdit'].length > 0) {
    const newMSDSFile = req.files['newMSDSEdit'][0];    
    const result2 = await uploadFile(newMSDSFile);
    await unlinkFile(newMSDSFile.path);

    coaPath = filePaths[0]['coa'];
    msdsPath = newMSDSFile.path.substring(8);
  }
  else {
    coaPath = filePaths[0]['coa'];
    msdsPath = filePaths[0]['msds'];
  }
  
  console.log("hazardous submit");
  console.log(req.body.editInciName);
  console.log(req.body.editTradeName);
  console.log(req.body.editAmount);
  console.log(req.body.editShelf);
  console.log(req.body.editClassifier);
  console.log(req.body.editLotNum);
  console.log(req.body.editReceived);
  console.log(req.body.editSupplier);
  console.log(req.body.editExpiration);
  console.log(req.body.editEncoding);
  console.log(req.body.hazardDetails);
  console.log(req.body.editCost);
  console.log(coaPath);
  console.log(msdsPath);


  db.updateIngredient(req.body.editInciName, req.body.editTradeName, req.body.editAmount, req.body.editShelf, req.body.editClassifier, req.body.editLotNum,
    req.body.editReceived, req.body.editSupplier, coaPath, msdsPath, req.body.editExpiration, req.body.editCost, req.body.hazardDetailsEdit, presetEncoding, ingredient_id, (error, results) => {
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


router.get("/images/:key", (req, res) => {
  const key = req.params.key;
  const readStream = getFileStream(key);

  readStream.pipe(res);
});



module.exports = router;