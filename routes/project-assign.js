const express = require('express');
const { resolve } = require('promise');
const { DOUBLE } = require('sequelize');
var router = express.Router();
const db = require("../db/project-assign_queries.js");


router.get("/", async function (req, res, next) {
    const admin = await new Promise((resolve, reject) => {
      db.requireAdmin(req.oidc.user.email, (error, admin) => {
        if (error) reject (error);
        else resolve(admin);
      });
    });


  if (admin[0].admin === 1) {
    try {
      const results = await new Promise((resolve, reject) => {
        db.read_projects_all_sql((error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });  
  
      for (let i = 0; i < results.length; i++) {
        const scientists = await new Promise((resolve, reject) => {
          db.getScientistForProject(results[i].project_id, (error, scientists) => {
            if (error) reject(error);
            else resolve(scientists);
          });
        });
        
        results[i].scientists = scientists;
        
      }
  
      for (let i = 0; i < results.length; i++) {
        const remainingScientists = await new Promise((resolve, reject) => {
          db.getRemainingScientistsForProject(results[i].project_id, (error, remainingScientists) => {
            if (error) reject(error);
            else resolve(remainingScientists);
          });
        });
  
        results[i].remainingScientists = remainingScientists;
      }
  
      const scientist_data = await new Promise((resolve, reject) => {
        db.getAllScientists((error, scientist_data) => {
          if (error) reject(error);
          else resolve(scientist_data);
        });
      });
  
      for (let i = 0; i < scientist_data.length; i++) {
        if (scientist_data[i].admin == 1) {
          scientist_data[i].role = "Admin";
        }
        else if (scientist_data[i].admin == 2)
          scientist_data[i].role = "Inventory Admin";
        else 
          scientist_data[i].role = "Scientist";
      }  
      res.render('project_assign', {results: results, scientist_data:scientist_data, isAdmin: admin[0].admin}); 
  
    } catch (error) {
      res.status(500).send(error); //Internal Server Error
    }
    }
    else if (admin[0].admin === 2) {
      res.redirect("/inventory");
    }
    else {
      res.redirect("/");
    }

    
});


router.get("/addScientist/:project_id/:scientist_id", async function (req, res, next) {
    let project_id = req.params.project_id
    let scientist_id = req.params.scientist_id
  
    const admin = await new Promise((resolve, reject) => {
      db.requireAdmin(req.oidc.user.email, (error, admin) => {
        if (error) reject (error);
        else resolve(admin);
      });
    });


  if (admin[0].admin) {
    db.assignScientistToProject(project_id, scientist_id, (error, results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error
      else {
        res.redirect('/project-assign');
      }
    });
  }
  else {
    res.redirect("/");
  }
});



router.get("/remove/:project_id/:scientist_id", (req, res) => {
    let project_id = req.params.project_id
    let scientist_id = req.params.scientist_id

    

    db.removeScientistFromProject(project_id, scientist_id, (error, results) => {
        if (error)
        res.status(500).send(error); //Internal Server Error
        else {
        res.redirect('/project-assign');
        }
    });
});    


router.post("/edituser/:scientist_id", async function (req, res, next) {
    let scientist_id = req.params.scientist_id;
   
    let name = req.body.name;
    let email = req.body.email;
    let adminInput = req.body.role;
  
    const isAdmin = await new Promise((resolve, reject) => {
      db.requireAdmin(req.oidc.user.email, (error, isAdmin) => {
        if (error) reject (error);
        else resolve(isAdmin);
      });
    });

    console.log("before try");
    try {
      if (isAdmin[0].admin === 1) {
        console.log("admin = 1");
        db.editUser(name, email, adminInput, scientist_id, (error, results) => {
            if (error)
                res.status(500).send(error);
            else 
                res.redirect("/project-assign");
        });
      }
      else {
        res.redirect("/")
      }
    }
    catch (error) {
      next(error);
    }
});


router.post("/deleteuser/:scientist_id", async function (req, res, next) {
    let scientist_id = req.params.scientist_id;
   
    const admin = await new Promise((resolve, reject) => {
      db.requireAdmin(req.oidc.user.email, (error, admin) => {
        if (error) reject (error);
        else resolve(admin);
      });
    });

    try {
      if (admin[0].admin == 1) {
        db.deleteUser(scientist_id, (error, results) => {
            if (error)
                res.status(500).send(error);
            else    
                res.redirect("/project-assign");
        });
      }
      else {
        res.redirect("/");
      }
    }
    catch (error) {
      next(error);
    }
});
  
router.get("/search/:input", async function (req, res, next) {
    let input = req.params.input;
    let searchStr = `%${input}%`;

  let results;

  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });

  console.log("after admin");

  try {

  if (admin[0].admin === 1) {
    console.log("BEFORE");
    results = await new Promise((resolve, reject) => {
      db.read_projects_search_project_assign(searchStr, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    console.log("read projects");
  }
  else {
    res.redirect("/");
  }

  const scientist_data = await new Promise((resolve, reject) => {
    db.getAllScientists((error, scientist_data) => {
      if (error) reject(error);
      else resolve(scientist_data);
    });
  });

  for (let i = 0; i < scientist_data.length; i++) {
    if (scientist_data[i].admin == 1) {
      scientist_data[i].role = "Admin";
    }
    else 
      scientist_data[i].role = "Scientist";
  }  

  console.log("scientist data");

  res.render('project_assign', {
    input: input,
    results: results,
    scientist_data: scientist_data,
    isAdmin: admin[0].admin
  });

  } catch (error) {
    res.redirect("/error"); 
  }
});



router.post("/createScientist", async function (req, res, next) {

  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });

  console.log(req.body.newScientistName);
  console.log(req.body.newScientistEmail);
  console.log(req.body.newRole);

  if (admin[0].admin === 1) {
    db.addScientist(req.body.newScientistName, req.body.newScientistEmail, req.body.newRole, (error, results) => {
      if (error)
        res.status(500).send(error);
      else    
        res.redirect("/project-assign");
    });
  }
  else {
    res.redirect("/");
  }
}); 


module.exports = router;