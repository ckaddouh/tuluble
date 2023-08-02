const express = require('express');
var router = express.Router();
const db = require("../db/projects_queries.js");

router.get("/sci/:scientist_id/search/:input", async function (req, res, next) {
  console.log("ARE YOU INSIDE THIS FUNCTION????????");
  let input = req.params.input
  let scientist_id = req.params.scientist_id

  let searchStr = `%${input}%`;

  let results;

  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });


  try {
    console.log("ARE YOU WITHIN THE TRY THIN??");
    const real_id = await new Promise((resolve, reject) => {
      db.getScientistID(req.oidc.user.email, (error, real_id) => {
        console.log("did you get inside here scientist");
        if (error) reject(error);
        else resolve(real_id);
      });
    });

  if (admin[0].admin === 1) {
    console.log("am i admin 1");
    results = await new Promise((resolve, reject) => {
      db.read_projects_search_all(searchStr, (error, results) => {
        console.log("ARE YOU INSIDE READ PROJECTS SEARCH ALL");
        if (error) reject(error);
        else resolve(results);
      });
    });
  }

  else if (admin[0].admin === 0 && real_id[0].scientist_id == scientist_id) {
    results = await new Promise((resolve, reject) => {
      db.read_projects_search(searchStr, scientist_id, (error, results) => {
        console.log("ARE YOU INSIDE READ PROJECTS SEARCH ??????");
        if (error) reject(error);
        else resolve(results);
      });
    });
  } 
  else if (admin[0].admin === 1) {
    console.log("ARE YOU HERE INVENTORY???");
    res.redirect("/inventory");
  }
  else {
    console.log("ARE YOU GUYS HERE IN ELSE");
    res.redirect("/projects/sci/" + real_id[0].scientist_id);
  }
  res.render('projects', {
    input: input,
    results: results,
    isAdmin: admin[0].admin
  });
  
  } catch (error) {
    res.redirect("/error"); 
  }
});




router.post("/:project_id/projectupdate", async function (req, res, next) {
  let error;

  let project_id = req.params.project_id

  console.log(project_id);
  console.log(req.body.editProjectName);
  console.log(req.body.editClientName);
  console.log(req.body.editDate);
  console.log(req.body.editContact);
  console.log(req.body.editEmail);

  try {
    const results = await new Promise((resolve, reject) => {
      db.updateProject(req.body.editProjectName, req.body.editClientName, req.body.editDate, req.body.editContact, req.body.editEmail, project_id, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    res.redirect("/projects");
  }
  catch (error) {
    next(error);
  }
});


router.post("/sci/:scientist_id/projectformsubmit", async function (req, res, next) {
  let scientist_id = req.params.scientist_id
 
  try {
    const results = await new Promise((resolve, reject) => {
      db.insertIntoProjects(req.body.newProjectName, req.body.newClientName, req.body.newDate, req.body.newContact, req.body.newEmail, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });

    const project_id = await new Promise((resolve, reject) => {
      db.getProjectID(req.body.newProjectName, req.body.newClientName, req.body.newDate, (error, project_id) => {
        if (error) reject(error);
        else resolve(project_id);
      });
    });


    const assigned = await new Promise((resolve, reject) => {
      db.assignScientistToProject(project_id[0].project_id, scientist_id, (error, assigned) => {
        if (error) reject(error);
        else resolve(assigned);
      });
    });


    res.redirect("/projects");
  }
  catch (error) {
    next(error);
  }
});


router.get("/", async function (req,res,next) {
  db.getScientistID(req.oidc.user.email, (error, results) => {
    res.redirect("/projects/sci/" + results[0].scientist_id);
  });
});


router.get("/sci/:scientist_id", async function (req, res, next) {
  let scientist_id = req.params.scientist_id;
  let results;

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

  if (admin[0].admin === 1) {
    results = await new Promise((resolve, reject) => {
      db.read_projects_all_sql((error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
  }
  else if (admin[0].admin === 0 && real_id[0].scientist_id == scientist_id) {
    results = await new Promise((resolve, reject) => {
      db.getProjectsAssignedToScientist(scientist_id, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
  } 
  else if (admin[0].admin === 2) {
    console.log("HELLO HELLOW");
    res.redirect("/inventory");
    return;
  }
  else {
    res.redirect("/projects/sci/" + real_id[0].scientist_id);
  }

  
  res.render('projects', { results: results, sci_id: real_id[0].scientist_id, isAdmin: admin[0].admin});

  } catch (error) {
    res.redirect("/error"); 
  }
});


router.get("/sci/archive-project/:project_id", (req, res) => {
  let project_id = req.params.project_id
  db.archiveProject(project_id, (error, results) => {
    if (error)
      res.redirect("/error"); //Internal Server Error
    else
      res.redirect('/projects');
  });
});


module.exports = router;