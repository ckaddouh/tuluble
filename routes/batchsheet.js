const express = require('express');
var router = express.Router();
const db = require("../db/batchsheet_queries.js");
const flash = require('express-flash');
const session = require('express-session');

router.use(session({
    secret: 'asekfjaosieug8ase9f7jsf', 
    resave: false,
    saveUninitialized: false
}));

router.use(flash());

router.get("/:project_id/:trial_num/:amount/makeformsubmit", async function (req, res, next) {
    let project_id = req.params.project_id
    let trial_num = req.params.trial_num
    let totalAmount = req.params.amount

    const ing_data = await new Promise((resolve, reject) => {
    db.getFormulaIngredientsForTrial(project_id, trial_num, (error, ing_data) => {
        if (error) reject(error);
        else resolve(ing_data);
    });
    }); 

    const ingredient_dict = [];
    for (let i = 0; i < ing_data.length; i++) {
        const trialIngData = await new Promise((resolve, reject) => {
            db.getIngredientTrialInfo(project_id, trial_num, ing_data[i].ingredient_id, (error, trialIngData) => {
            if (error) reject(error);
            else resolve(trialIngData);
            });
        });


        trialIngData[0]['amount'] = (trialIngData[0].percent_of_ingredient/100)*totalAmount;
        ingredient_dict[i] = trialIngData[0];


        const amtResults = await new Promise((resolve, reject) => {
            db.subtractAmounts(trialIngData[0]['amount'], ing_data[i].ingredient_id, (error, amtResults) => {
                if (error)
                    res.status(500).send(error);
                else resolve(amtResults);
            });
        });
    }
  
    db.markUneditable(project_id, trial_num, (error, results) => {
      if (error)
        res.status(500).send(error);
    });
    
    res.redirect('/batchsheet/' + project_id + "/" + trial_num + "/" + totalAmount);
});

router.get("/:project_id/:trial_num/:amount", async function (req, res, next) {
    let project_id = req.params.project_id
    let trial_num = req.params.trial_num
    let amount = req.params.amount
    let error

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
    
    if (admin[0].admin || assigned.length !== 0) {
      const project_data = await new Promise((resolve, reject) => {
        db.singleProject(project_id, (error, project_data) => {
          if (error) reject(error);
          else resolve(project_data);
        });
      });
  
  
    const ing_data = await new Promise((resolve, reject) => {
      db.getFormulaIngredientsForTrial(project_id, trial_num, (error, ing_data) => {
        if (error) reject(error);
        else resolve(ing_data);
      });
    }); 
      
    const sum = await new Promise((resolve, reject) => {
      db.selectTrialSums(project_id, trial_num, (error, sum) => {
        if (error) reject(error);
        else resolve(sum);
      });
    });
  
  
    var formulaComplete = 1;
    if (sum[0].percentSum != 100) {
      formulaComplete = 0;
    }
  
    if (!formulaComplete) {
      req.flash('warning', 'Formula ingredients do not sum to 100%. Please return to previous page and edit formula.');
    }
  
    const inventory_data = await new Promise((resolve, reject) => {
      db.read_inventory_all_alph((error, inventory_data) => {
        if (error) reject(error);
        else resolve(inventory_data);
      });
});
    
    const ingredient_dict = [];
    let maxVal = Number.POSITIVE_INFINITY;
  
    for (let i = 0; i < ing_data.length; i++) {
      const trialIngData = await new Promise((resolve, reject) => {
       
        db.getIngredientTrialInfo(project_id, trial_num, ing_data[i].ingredient_id, (error, trialIngData) => {
          if (error) reject(error);
          else resolve(trialIngData);
        });
      });
  
      trialIngData[0]['amount'] = (trialIngData[0].percent_of_ingredient/100)*amount;
      ingredient_dict[i] = trialIngData[0];
  
      const curAmount = await new Promise((resolve, reject) => {
        db.getIngAmount(ing_data[i].ingredient_id, (error, curAmount) => {
          if (error) reject(error);
          else resolve(curAmount);
        });
      });
    
      let localMax = curAmount[0].amt/(trialIngData[0].amount/100);
  
      if (localMax < maxVal) {
        maxVal = localMax; 
      }
    }
     
    var sufficient = 1;
    if (maxVal < amount)
      sufficient = 0;
  
    maxVal = Math.trunc(maxVal); 
  
    if (!sufficient) {
      req.flash('warning', 'You are lacking the ingredients to produce ' + amount + ' grams of this formula. The maximum amount you can make is ' + maxVal + ' grams.');
    }
    
    const ingredientDictJSON = JSON.stringify(ingredient_dict);
  
    if (error)
    res.redirect("/error");
  else {
    res.render('batchsheet', {
      project_id: project_id,
      trial_num: trial_num,
      ing_data: ing_data,
      project_data: project_data,
      sum: sum[0].percentSum,
      ingredient_dict: ingredient_dict,
      amount: amount,
      sufficient: sufficient,
      maxVal: maxVal,
      formulaComplete: formulaComplete, 
      messages: req.flash('warning'),
      isAdmin: admin[0].admin
    });
  }
  
  }
  else {
    res.redirect("/projects/sci/" + real_id[0].scientist_id);
  } 
  } catch (error) {
    res.redirect("/error");
  }
  
  });

module.exports = router;