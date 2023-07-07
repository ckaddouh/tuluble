const express = require('express');
var router = express.Router();
const db = require("../db/archive_queries.js");

var isAdmin = true;

router.get("/ingredient/search/:input", (req, res) => {
    let input = req.params.input
    let searchStr = `%${input}%`;
    db.read_archive_inventory_search(searchStr, (error, results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error 
      else {
        res.render('archive', {
          input: input,
          results: results
        });
      }
    });
});
    
  
router.get("/projects/sci/:scientist_id/search/:input", async function (req, res, next) {
    let input = req.params.input
    let scientist_id = req.params.scientist_id
  
    let searchStr = `%${input}%`;
  
    let results;
  
    try {
      const real_id = await new Promise((resolve, reject) => {
        db.getScientistID(req.oidc.user.email, (error, real_id) => {
          if (error) reject(error);
          else resolve(real_id);
        });
      });
  
      if (isAdmin) {
        results = await new Promise((resolve, reject) => {
          db.read_archive_projects_search_all(searchStr, (error, results) => {
            if (error) reject(error);
            else resolve(results);
          });
        });  
      }
      else if (real_id[0].scientist_id == scientist_id) {
        results = await new Promise((resolve, reject) => {
          db.read_archive_projects_search(searchStr, scientist_id, (error, results) => {
            if (error) reject(error);
            else resolve(results);
          });
        });
      } 
      else {
        res.redirect("/archive/projects/sci/" + real_id[0].scientist_id);
      }
      res.render("archive", {
        input: input,
        results: results
      });
      } catch (error) {
        res.redirect("/error"); 
      }
});

router.get("/", async function (req,res,next) {
    db.getScientistID(req.oidc.user.email, (error, results) => {
      res.redirect("/archive/sci/" + results[0].scientist_id);
    });
});

router.get("/sci/:scientist_id", async function (req, res, next) {
    let scientist_id = req.params.scientist_id;
    let ingredients;
    let projects;
  
    try {
      const real_id = await new Promise((resolve, reject) => {
        db.getScientistID(req.oidc.user.email, (error, real_id) => {
          if (error) reject(error);
          else resolve(real_id);
        });
      });
  
  
    if (isAdmin) {
      results = await new Promise((resolve, reject) => {
        db.read_inactive_ingredients_all_sql((error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });
      console.log("error with ings");
  
      project_results = await new Promise((resolve, reject) => {
        db.read_inactive_projects_all_sql((error, project_results) => {
          if (error) reject(error);
          else resolve(project_results);
        });
      });

      console.log("error with projecsts");
      
    }
    else if (real_id[0].scientist_id == scientist_id) {
        console.log("not admin");

      results = await new Promise((resolve, reject) => {
        db.read_inactive_ingredients_all_sql((error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });
  
      project_results = await new Promise((resolve, reject) => {
        db.read_inactive_projects_archived(scientist_id, (error, project_results) => {
          if (error) reject(error);
          else resolve(project_results);
        });
      });

    } 
    else {
      res.redirect("/archive/sci/" + real_id[0].scientist_id);
    }
    res.render('archive', { results: results, project_results: project_results });
  
    } catch (error) {
      res.redirect("/error"); 
    }
});

router.get("/unarchive-ingredient/:ingredient_id", (req, res) => {
    let ingredient_id = req.params.ingredient_id
    db.unarchiveIngredient(ingredient_id, (error, results) => {
      if (error)
        res.redirect("/error"); //Internal Server Error
      else
        res.redirect('/archive');
    });
});
  
  
router.get("/unarchive-project/:project_id", (req, res) => {
    let project_id = req.params.project_id
    db.unarchiveProject(project_id, (error, results) => {
        if (error)
        res.redirect("/error"); //Internal Server Error
        else
        res.redirect('/archive#projects');
    });
});


module.exports = router;