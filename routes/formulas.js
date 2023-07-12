const express = require('express');
var router = express.Router();
const db = require("../db/formulas_queries.js");


router.get("/:project_id/addedIngredient/trial:trial_num/ingredient:ingredient_id/phase:phase_num/:cellContent", (req,res) => { 
  let project_id = req.params.project_id;
  let trial_num = req.params.trial_num;
  let ingredient_id = req.params.ingredient_id;
  let cellContent = req.params.cellContent;
  let phase = req.params.phase_num;

  db.insertIntoPhase(project_id, trial_num, phase, cellContent, ingredient_id, (error, results) => {
    if (error)
    res.status(500).send(error); //Internal Server Error 
    else {
      res.redirect("/formulas/" + project_id);
    }
  });

});


router.get("/:project_id/cellEdited/:type/trial:trial_num/ingredient:ingredient_id/phase:phase_num/:cellContent", (req, res) => {
  let project_id = req.params.project_id;
  let type = req.params.type;
  let trial_num = req.params.trial_num;
  let ingredient_id = req.params.ingredient_id;
  let cellContent = req.params.cellContent;

  db.editFormulaIngredient(cellContent, project_id, trial_num, ingredient_id, (error, results) => {
    if (error)
    res.status(500).send(error); //Internal Server Error 
    else {
      res.redirect("/formulas/" + project_id);
    }
  });
});



router.post("/:project_id/formulaformsubmit", async function (req, res, next) {
  let project_id = req.params.project_id;

  try {
    db.insertIntoFormulas(project_id, req.body.userInput1, req.body.userInput3, req.body.userInput2, (error, results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error 
      else {
        res.redirect("/formulas/" + project_id);
      }
    })
  }
  catch (error) {
    next(error);
  }
});


router.post("/:project_id/phaseformsubmit", async function (req, res, next) {
  let project_id = req.params.project_id;

  db.insertIntoPhase(project_id, req.body.userInput0, req.body.userInput1, req.body.userInput3, req.body.userInput2, (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error 
    else {
      res.redirect( "/formulas/" + project_id);
    }
  });
});


router.get("/:project_id", async function (req,res,next) {
  let project_id = req.params.project_id
  let error;

  try {
    const admin = await new Promise((resolve, reject) => {
      db.requireAdmin(req.oidc.user.email, (error, admin) => {
        if (error) reject (error);
        else resolve(admin);
      });
    });

    const real_id = await new Promise((resolve, reject) => {
      db.getScientistID(req.oidc.user.email, (error, real_id) => {
        if (error) reject(error);
        else resolve(real_id);
      });
    });


    const assigned = await new Promise((resolve, reject) => {
      db.getAssignedProjects(real_id[0].scientist_id, project_id, (error, assigned) => {
        if (error) reject(error);
        else resolve(assigned);
      });
    });

  if (admin[0].admin === 1 || assigned.length !== 0) {
    const project_data = await new Promise((resolve, reject) => {
      db.singleProject(project_id, (error, project_data) => {
        if (error) reject(error);
        else resolve(project_data);
      });
    });

    const trial_data = await new Promise((resolve, reject) => {
      db.getTrials(project_id, (error, trial_data) => {
        if (error) reject(error);
        else resolve(trial_data);
      });
    });


    let ing_data = [];

    if (admin[0].admin === 1) {
      try {
        ing_data = await new Promise((resolve, reject) => {
          db.getFormulaIngredients(project_id, (error, ingData) => {
            if (error) reject(error);
            else resolve(ingData);
          });
        });
      } catch (error) {
        console.error(error);
      }
    } 
    else if (admin[0].admin === 0) {
      try {
        ing_data = await new Promise((resolve, reject) => {
          db.getFormulaIngredientsEncoded(project_id, (error, ingData) => {
            if (error) reject(error);
            else resolve(ingData);
          });
        });
      } catch (error) {
        console.error(error);
      }
    }

    let sum_data = [];
    for (let i = 0; i < trial_data.length; i++) {
      const sum = await new Promise((resolve, reject) => {
        db.selectTrialSums(project_id, trial_data[i].trial_num, (error, sum_data) => {
          if (error) reject(error);
          else resolve(sum_data);
        });
      });

      if (sum[0].percentSum)
        sum_data.push(sum[0].percentSum);
      else  
        sum_data.push(0);
    }


    const ingredient_dict = [];

    var editable_dict = [];
    var approved_dict = [];

    for (let j = 0; j < trial_data.length; j++) {
      const approved = await new Promise((resolve, reject) => {
        db.getApproved(project_id, trial_data[j].trial_num, (error, approved) => {
          if (error) reject(error);
          else resolve(approved);
        });
      });
      
      approved_dict[j] = approved[0].approved;
    }

    for (let i = 0; i < ing_data.length; i++) {
      ingredient_dict[i] = [];
      editable_dict[i] = [];

    
      for (let j = 0; j < trial_data.length; j++) {

        const trialIngData = await new Promise((resolve, reject) => {
          db.getIngredientTrialInfo(project_id, trial_data[j].trial_num, ing_data[i].ingredient_id, (error, trialIngData) => {
            if (error) reject(error);
            else resolve(trialIngData);
          });
        });


        ingredient_dict[i][j] = trialIngData;
       
        if (trialIngData.length === 0) {
          ingredient_dict[i][j] = [{
            trial_num: trial_data[j].trial_num,
            ingredient_id: ing_data[i].ingredient_id,
            phase: ing_data[i].phase,
            percent_of_ingredient: ''
          }];   
          editable_dict[i][j] = "true";
        }

        const ed = await new Promise((resolve, reject) => {
          db.getEditability(project_id, trial_data[j].trial_num, (error, ed) => {
            if (error) reject(error);
            else resolve(ed);
          });
        });

        if (ed[0].editable == '1') {
          editable_dict[i][j] = "true";
        }
        else {
          editable_dict[i][j] = "false";
        }
      }
    }
  

    const inventory_data = await new Promise((resolve, reject) => {
      db.read_inventory_all_alph((error, inventory_data) => {
        if (error) reject(error);
        else resolve(inventory_data);
      });
    })

    const ingredientDictJSON = JSON.stringify(ingredient_dict);
    const editableDictJSON = JSON.stringify(editable_dict);
    const approvedDictJSON = JSON.stringify(approved_dict);

    if (error)
      res.redirect("/error");
    else {
      res.render('formulas', {
        project_id: project_id,
        ing_data: ing_data,
        project_data: project_data,
        trial_data: trial_data.length,
        trialData: trial_data,
        inventory_data: inventory_data,
        ingredient_dict: ingredientDictJSON,
        sum_data_json: JSON.stringify(sum_data), 
        editable_dict: editableDictJSON,
        approved_dict: approvedDictJSON,
        isAdmin: admin[0].admin
      });
    }
  }
  else if (admin[0].admin === 2) {
    console.log("NOT ADMIN!!");
    res.redirect("/inventory");
    return;
  }
  else {
    res.redirect("/projects/sci/" + real_id[0].scientist_id);
    return;
  } 
  } catch (error) {
    res.redirect("/error");
    return;
  }
});


router.get("/:project_id/removeTrialApproval/:trial_num", async function (req,res,next) {
  let project_id = req.params.project_id;
  let trial_num = req.params.trial_num;
  let error;

  try {
    const removed = await new Promise((resolve, reject) => {
      db.removeTrialApproval(project_id, trial_num, (error, removed) => {
        if (error) reject(error);
        else resolve(removed);
      });
    });


    res.redirect( "/formulas/" + project_id);
  } catch (error) {
    res.redirect("/error");
  }
});


router.post("/:project_id/batchformsubmit", async function (req, res, next) {
  let project_id = req.params.project_id
  let trial_num = req.body.userInput1T

  res.redirect( "/batchsheet/" + project_id + "/" + trial_num + "/" + req.body.userInput2T);


});


router.get("/:project_id/deleteTrial/:trial_num", (req, res) => {
  let trial_num = req.params.trial_num;
  let project_id = req.params.project_id;
  
  db.delete_trial(project_id, trial_num, (error, results) => {
    db.delete_trial2(project_id, trial_num, (error, results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error 
      else {
        res.redirect("/formulas/" + project_id);
      }
    });
  });
});


router.get("/:project_id/approveTrial/:trial_num", (req, res) => {
  let trial_num = req.params.trial_num;
  let project_id = req.params.project_id;
  
  db.approve_trial(project_id, trial_num, (error, results) => {
    db.markUneditable(project_id, trial_num, (error, results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error 
      else {
        res.redirect("/formulas/" + project_id);
      }
    });
  });
});



router.get("/:project_id/deleteFormulaIngredient/:ingredient_id", (req, res) => {
  let project_id = req.params.project_id;
  let ingredient_id = req.params.ingredient_id;
  
  db.delete_formula_ingredient(project_id, ingredient_id, (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error 
    else {
      res.redirect("/formulas/" + project_id);
    }
  });
});

module.exports = router;