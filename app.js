var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// var userInput = inventory.get(inputValue1);

var indexRouter = require('./routes/index');
var inventoryRouter = require('./routes/inventory');
var projectsRouter = require('./routes/projects');

const { auth } = require('express-openid-connect');
const db = require("./db/db_connection");
const hbs = require("hbs");
// const style = require("css");

const { realpathSync } = require('fs');
const { hasSubscribers } = require('diagnostics_channel');
const { literal } = require('sequelize');

const port = 3000;
var app = express();

var isAdmin = false;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// loads environment variables from env file
require('dotenv').config()

// //Routers for different parts of the website
// app.use('/', indexRouter);
// app.use('/inventory', inventoryRouter);
// app.use('/formulas', formulasRouter);
// app.use('/projects', projectsRouter);

const authConfig = {
  authRequired: true,
  auth0Logout: true,
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_BASEURL,
  clientID: process.env.AUTH_CLIENTID,
  issuerBaseURL: process.env.AUTH_ISSUERBASEURL
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(authConfig));

function requireAdmin(req, res, next) {
  console.log("res admin");
  console.log(isAdmin);
  if (isAdmin)
    next();
  else
    res.redirect("/");
  // next("AGHHH NOT ALLOWED");
}
// app.use( async (req, res, next) => {
//   res.locals.isAuthenticated = req.oidc.isAuthenticated();
//   if (res.locals.isAuthenticated){
//     //check if admin
//     let results = await db.queryPromise("SELECT admin FROM user WHERE email = ?", [req.oidc.user.email])
//     if (results.length > 0) {
//       res.locals.isAdmin = (results[0].admin == 1)
//     } else {
//       //if no account yet, set up user row in database (account information)
//       //For now, we'll just make a quick "account" with just the email info
//       await db.queryPromise("INSERT INTO user (email) VALUES (?)", [req.oidc.user.email]);
//       res.locals.isAdmin = false;
//     }
//   }
//   next();
// })

// req.isAuthenticated is provided from the auth router
// app.get('/', (req, res) => {
//   res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
// });

// app.get('/profile', requiresAuth(), (req, res) => {
//   res.send(JSON.stringify(req.oidc.user));
// });


//this one only shows oils...
const read_inventory_all_sql = `
    SELECT
        ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, unit, coa, msds
    FROM
        ingredient
    WHERE 
      classifier_id = "Oils" AND active = 1
`

const read_inventory_all_alph = `
    SELECT
        ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, unit, coa, msds
    FROM
        ingredient
    WHERE 
      active = 1
      AND inci_name != ''
    ORDER BY 
      inci_name ASC
`

const read_projects_all_sql = `
    SELECT
        project_name, project_id, client, date
    FROM
        projects
    WHERE 
      active = 1
`

const read_project_data_for_assign = `
  SELECT
    project_name, projects.project_id, client, date, scientist.name, scientist.scientist_id
  FROM
    projects, scientist, project_assign
  WHERE 
    active = 1
    AND project_assign.project_id = projects.project_id
    AND project_assign.scientist_id = scientist.scientist_id
`

const singleProjectQuery = `
    SELECT
        projects.project_name, projects.project_id, projects.client, projects.date
    FROM
        projects
    WHERE
        projects.project_id = ?
`

const selectTrialNums = `
  SELECT 
    trial_num, project_id
  FROM
    formulas
  WHERE
    formulas.project_id = ?
  GROUP BY
    trial_num
`

const archiveIngredient = `
  UPDATE ingredient
  SET active = 0
  WHERE ingredient_id = ?
`

const unarchiveIngredient = `
  UPDATE ingredient
  SET active = 1
  WHERE ingredient_id = ?
`

const archiveProject = `
  UPDATE projects
  SET active = 0
  WHERE project_id = ?
`

const unarchiveProject = `
  UPDATE projects
  SET active = 1
  WHERE project_id = ?
`

// const selectAllProjectFormulas = `
//   SELECT
//     formulas.formula_id, projects.project_id, trial_num, trade_name, inci_name, phase, percent_of_ingredient, total_amount, ingredient.ingredient_id, projects.project_name, projects.project_id, projects.client, projects.date
//   FROM
//     formulas, formula_ingredient, ingredient, projects
//   WHERE
//     formulas.project_id = ?
//     AND formulas.project_id = projects.project_id
//     AND formula_ingredient.formula_id = formulas.formula_id
//     AND formula_ingredient.ingredient_id = ingredient.ingredient_id
// `

const selectFormulaIngredients = `
  SELECT
    trade_name, inci_name, phase, percent_of_ingredient, total_amount, ingredient.ingredient_id, lot_num, ingredient.unit
  FROM 
    formulas, formula_ingredient, ingredient
  WHERE
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formulas.formula_id = formula_ingredient.formula_id
    AND formulas.trial_num = ?
    AND formulas.project_id = ?
`

const selectTrialData = `
  SELECT
    formulas.batch_date, formulas.trial_num, formulas.formulator, formulas.project_id, SUM(total_amount) as s, SUM(percent_of_ingredient) as percent
  FROM 
    formulas, formula_ingredient
  WHERE
    formulas.formula_id = formula_ingredient.formula_id
    AND formulas.trial_num = ?
    AND formulas.project_id = ?
`

const selectBasicTrialData = `
  SELECT 
    formulas.batch_date, formulas.formulator, formulas.formula_id
  FROM 
    formulas
  WHERE
    formulas.trial_num = ?
    AND formulas.project_id = ?
  LIMIT 1
`

const read_inactive_ingredients_all_sql = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, unit
  FROM
    ingredient
  WHERE 
    active = 0
`

const read_inactive_projects_all_sql = `
  SELECT
    project_name, project_id, client, date
  FROM
    projects
  WHERE 
    active = 0
`

const insertIntoInventory = `
  INSERT INTO 
    ingredient (inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, supplier, unit, coa, msds)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`
const insertIntoInventory1 = `
  INSERT INTO 
    ingredient (inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, supplier, unit)
  VALUES (?, "Trade Name", "23", "3A", "thickener", "AM09348", "0000-00-00", "Alban Muller", "g")
`

const read_inventory_classifier_sql = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, unit
  FROM
    ingredient
  WHERE 
    classifier_id = ?
`

const insertIntoProjects = `
  INSERT INTO 
    projects (project_name, client, date, active)
  VALUES (?, ?, ?, 1)
`

const
  updateIngredient = `
  UPDATE 
    ingredient
  SET 
    inci_name = ?, trade_name = ?, amt = ?, shelf = ?, classifier_id = ?, lot_num = ?, date_received = ?, supplier = ?, unit = ?, coa = ?, msds = ?
  WHERE 
    ingredient_id = ?
`

const updateProject = `
  UPDATE 
    projects
  SET 
    project_name = ?, client = ?, date = ?
  WHERE 
    project_id = ?
`

const getLowAmounts = `

  SELECT
    ingredient_id, inci_name, trade_name, amt, expiration, unit
  FROM 
    ingredient
  WHERE
    ingredient.low = 1 
    AND ingredient.active = 1
`

const getExpired = `
  SELECT
    ingredient_id, inci_name, trade_name, amt, expiration, unit
  FROM 
    ingredient
  WHERE
    ingredient.expiration <= UTC_DATE()
    AND ingredient.active = 1
`

const checkFormulaSum = `
  UPDATE
    

`

const insertIntoFormulas = `
  INSERT INTO formulas (project_id, trial_num, batch_date, formulator)
  VALUES (?, ?, ?, ?)
`


const findIngredientID = `
  SELECT ingredient_id
  FROM ingredient
  WHERE ingredient.lot_num = ?
`

const insertIntoPhaseOLD = `
  INSERT INTO formula_ingredient (formula_id, phase, percent_of_ingredient, total_amount, ingredient_id)
  VALUES (?, ?, ?, ?, ?)
`

const insertIntoPhase = `
  INSERT INTO formula_ingredient (formula_id, trial_num, phase, percent_of_ingredient, total_amount, ingredient_id)
  VALUES (?, ?, ?, ?, ?, ?)
`

const selectSearchedIngredients = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, unit
  FROM
    ingredient
  WHERE 
    ingredient_id IN ?
    AND classifier_id = ?
`

const read_inventory_search = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, unit, coa, msds
  FROM
    ingredient
  WHERE 
    ingredient.inci_name LIKE ?
`



const get_procedure = `
  SELECT 
    phase_num, proc, comments, temp_init, temp_final, timing, mixing_init, mixing_final, mixer_type, blade, project_id, trial_num
  FROM 
    procedure_item
  WHERE 
    project_id = ? AND trial_num = ?
`

const get_procedure_info = `
  SELECT 
    projects.project_name
  FROM
    projects
  WHERE
    projects.project_id = ?
`

const select_ing_per_phase = `
  SELECT
    trade_name
  FROM 
    formulas, formula_ingredient, ingredient
  WHERE
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formulas.formula_id = formula_ingredient.formula_id
    AND formulas.project_id = ?
    AND formulas.trial_num = ?
    AND formula_ingredient.phase = ?
`

const insert_procedure = `
  INSERT INTO 
    procedure_item (phase_num, proc, comments, temp_init, temp_final, timing, mixing_init, mixing_final, mixer_type, blade, project_id, trial_num)
  VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`


const getIngredientIDs = `
  SELECT
    ingredient.ingredient_id
  FROM 
    formulas, formula_ingredient, ingredient
  WHERE
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formulas.formula_id = formula_ingredient.formula_id
    AND formulas.trial_num = ?
    AND formulas.project_id = ?
`

const getAmount = `
  SELECT
    DISTINCT total_amount
  FROM 
    formula_ingredient, formulas
  WHERE
    formulas.project_id = ?
    AND formulas.trial_num = ?
    AND formula_ingredient.ingredient_id = ?
`

const subtractAmounts = `
  UPDATE
    ingredient
  SET 
    amt = amt - (? * (?/?))
  WHERE 
    ingredient_id = ?
`

const computeMax = `
  UPDATE
    ingredient
  SET 
    amt = amt - (? * (?/?))
  WHERE 
    ingredient_id = ?
`

const getTotalAmountOfFormula = `
  SELECT
    SUM(total_amount) as s
  FROM 
    formulas, formula_ingredient
  WHERE
    formulas.formula_id = formula_ingredient.formula_id
    AND formulas.trial_num = ?
    AND formulas.project_id = ?
`

const getAllScientists = `
  SELECT 
    scientist.name, scientist.scientist_id
  FROM 
    scientist
`

const getScientistForProject = `
  SELECT
    name, scientist.scientist_id
  FROM
    scientist, project_assign
  WHERE
    project_id = ?
    AND scientist.scientist_id = project_assign.scientist_id
`

const assignScientistToProject = `
  INSERT INTO 
    project_assign (project_id, scientist_id)
    VALUES (?, ?)
`

const removeScientistFromProject = `
  DELETE FROM 
    project_assign 
  WHERE
    project_id = ?
    AND scientist_id = ?
`

const newFormulaDisplay = `
  SELECT
    formulas.trial_num, trade_name, inci_name, phase, percent_of_ingredient, total_amount, ingredient.ingredient_id, lot_num, ingredient.unit
  FROM 
    formulas, formula_ingredient, ingredient
  WHERE
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formulas.formula_id = formula_ingredient.formula_id
    AND formulas.project_id = ?
    ORDER BY formulas.trial_num
`

const getTrials = `
  SELECT DISTINCT trial_num, formula_id
  FROM formulas
  WHERE project_id = ?
  ORDER BY trial_num
`



const partialsPath = path.join(__dirname, "public/partials");
hbs.registerPartials(partialsPath);
// style.registerPartials(partialsPath);

app.use(async (req, res, next) => {
  res.locals.isAuthenticated = req.oidc.isAuthenticated();

  if (res.locals.isAuthenticated) {
    //check if admin
    db.execute("SELECT admin FROM scientist WHERE email = ?", [req.oidc.user.email], (error, results) => {
      if (results.length > 0) {
        res.locals.isAdmin = (results[0].admin == 1)
        isAdmin = (results[0].admin == 1)
      } else {
        //if no account yet, set up user row in database (account information)
        //For now, we'll just make a quick "account" with just the email info
        db.execute("INSERT INTO scientist (email) VALUES (?)", [req.oidc.user.email], (error, results2) => {
          res.locals.isAdmin = false;
        });
      }
    })

  }
  next();
})

app.get('/profile', (req, res) => {
  const user = req.oidc.user.nickname;
  console.log(user);
});

app.get("/", (req, res) => {
  db.execute(getLowAmounts, (error, results) => {
    db.execute(getExpired, (error, results2) => {
      if (error)
        res.status(500).send(error); //Internal Server Error
      else {
        res.render('index', { runningLow: results, expired: results2, profileInfo: req.oidc.user.nickname });
      }
    });
  });
});

app.get("/test", (req, res) => {
  res.render('testpage');
});

// app.get("/project-assign", requireAdmin, async function (req, res, next) {
//   // res.locals.isAuthenticated = req.oidc.isAuthenticated();
//   var scientistDict = {};
//   var results;
//   var scientists;

//   db.execute(read_projects_all_sql, (error, results) => {
//     for (let i = 0; i < results.length; i++) {
//       console.log(results[i].project_id);

//       db.execute(getScientistForProject, [results[i].project_id], (error, scientists) => {
//         console.log("hello");
//         scientistDict[results[i].project_id] = scientists;
//         console.log(scientistDict);


//         if (error)
//           res.status(500).send(error); //Internal Server Error            

//       });
//       console.log("test");
//     }
//     console.log("Dict:");
//     console.log(scientistDict);

//     console.log(results);

//   });
//   console.log(scientistDict);


//   console.log("GOING TO PROJECT ASSIGN PAGE");
//   res.render('project_assign', { scientistDict: scientistDict, results: results, scientists: scientists });

// });

app.get("/project-assign", requireAdmin, async function (req, res, next) {
  // res.locals.isAuthenticated = req.oidc.isAuthenticated();

  db.execute(read_projects_all_sql, (error, results) => {
    db.execute(getAllScientists, (error, scientistResults) => {
      res.render('project_assign', { results: results, scientist_data: scientistResults });

    })

  });





});


app.get("/project-assign/:project_id/assignscientist", (req, res) => {
  console.log("BRUH");
  let project_id = req.params.project_id
  let scientist_id = req.params.scientist_id

  db.execute(assignScientistToProject, [req.params.project_id, req.body.select_assign], (error, results) => {
    console.log("WE ARE HERE");
    if (error)
      res.status(500).send(error); //Internal Server Error
    else {
      res.redirect('/project_assign');
    }
  });
});

app.post("/project-assign/remove/:project_id/:scientist_id", (req, res) => {
  let project_id = req.params.project_id
  let scientist_id = req.params.scientist_id

  db.execute(removeScientistFromProject, [project_id, scientist_id], (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else {
      res.redirect('/project_assign');
    }
  });
});

// app.get("/index", (req, res) =>{
//   res.render('index');
// });

app.get("/projects/:project_id/trial:trial_num/trial:trial_num2", (req, res) => {
  let project_id = req.params.project_id
  let trial_num1 = req.params.trial_num
  let trial_num2 = req.params.trial_num2

  console.log(trial_num1)
  console.log(trial_num2)

  db.execute(singleProjectQuery, [project_id], (error, project_data) => {
    db.execute(selectTrialNums, [project_id], (error, formula_data) => {
      // need to select formula_ingredients for specific trial_nums for each of the trial_nums in above query
      // perhaps retrieve based on trial_nums that user selects to view? 
      // [project_id, trial_num]
      db.execute(selectFormulaIngredients, [trial_num1, project_id], (error, formula_ingredient_data1) => {
        db.execute(selectFormulaIngredients, [trial_num2, project_id], (error, formula_ingredient_data2) => {
          db.execute(selectTrialData, [trial_num1, project_id], (error, trial_data1) => {
            db.execute(selectTrialData, [trial_num2, project_id], (error, trial_data2) => {
              db.execute(selectBasicTrialData, [trial_num1, project_id], (error, trialData1) => {
                db.execute(selectBasicTrialData, [trial_num2, project_id], (error, trialData2) => {
                  db.execute(read_inventory_all_alph, (error, results) => {
                    if (error)
                      res.status(500).send(error); //Internal Server Error
                    else {
                      // res.render('project', {project_data: results[0]} );
                      res.render('formulas', {
                        title: 'Project Details',
                        styles: ["tables", "event"],
                        project_id: project_id,
                        project_data: project_data,
                        formula_data: formula_data,
                        formula_ingredient_data1: formula_ingredient_data1,
                        formula_ingredient_data2: formula_ingredient_data2,
                        trial_data1: trial_data1,
                        trial_data2: trial_data2,
                        trial_num1: req.params.trial_num,
                        trial_num2: req.params.trial_num2,
                        trialData1: trialData1,
                        trialData2: trialData2,
                        inventory_data: results
                      });
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.get("/inventory", (req, res) => {
  db.execute(read_inventory_all_sql, (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else {
      res.render('inventory', { results: results });
    }
  });
});

app.get("/inventory/:classifier_id", (req, res) => {
  let classifier_id = req.params.classifier_id
  db.execute(read_inventory_classifier_sql, [classifier_id], (error, results) => {
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

app.get("/inventory/search/:input", (req, res) => {
  let input = req.params.input
  let searchStr = `%${input}%`;
  db.execute(read_inventory_search, [searchStr], (error, results) => {
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

app.post("/inventory/inventoryformsubmit", async function (req, res, next) {
  console.log("HELLO");
  console.log(req.body.userInput1);
  console.log(req.body.userInput2);
  console.log(req.body.userInput3);
  console.log(req.body.userInput4);
  console.log(req.body.userInput5);
  console.log(req.body.userInput6);
  console.log(req.body.userInput7);
  console.log(req.body.userInput8);
  console.log(req.body.userInput9);
  console.log(req.body.userInput10);
  console.log(req.body.userInput11);
  //console.log(typeof(req.body.userInput11))

  db.execute(insertIntoInventory, [req.body.userInput1, req.body.userInput2, req.body.userInput3, req.body.userInput4, req.body.userInput5, req.body.userInput6,
  req.body.userInput7, req.body.userInput8, req.body.userInput9, req.body.userInput10, req.body.userInput11], (error, results) => {
    if (error) {
      console.error("Error executing SQL query:", err);
      res.status(500).send(error); //Internal Server Error 
    }
    else {
      console.log("Success! :D")
      res.redirect('/inventory');
    }
  });
});


app.post("/inventory/:ingredient_id/inventoryingredientupdate", async function (req, res, next) {
  let ingredient_id = req.params.ingredient_id
  console.log("HELLO");
  console.log("UserInput1" + req.body.userInput1);
  console.log("UserInput2" + req.body.userInput2);
  console.log("UserInput3" + req.body.userInput3);
  console.log("UserInput4" + req.body.userInput4);
  console.log("UserInput5" + req.body.userInput5);
  console.log("UserInput6" + req.body.userInput6);
  console.log("UserInput7" + req.body.userInput7);
  console.log("UserInput8" + req.body.userInput8);
  console.log("UserInput9" + req.body.userInput9);
  console.log("UserInput10" + req.body.userInput10);
  console.log("UserInput11" + req.body.userInput11);
  console.log("UserInput12" + ingredient_id)

  db.execute(updateIngredient, [req.body.userInput1, req.body.userInput2, req.body.userInput3, req.body.userInput4, req.body.userInput5, req.body.userInput6,
  req.body.userInput7, req.body.userInput8, req.body.userInput9, req.body.userInput10, req.body.userInput11, ingredient_id], (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error 
    else {
      res.redirect("/inventory");
    }
  });
});

app.post("/projects/:project_id/projectupdate", async function (req, res, next) {
  let project_id = req.params.project_id

  try {
    db.execute(updateProject, [req.body.userInput1, req.body.userInput2, req.body.userInput3, project_id]);
    res.redirect("/projects");
  }
  catch (error) {
    next(error);
  }
});

app.post("/projects/projectformsubmit", async function (req, res, next) {
  console.log("Project Form Submit Details:");
  console.log(req.body.userInputP1);
  console.log(req.body.userInputP2);
  console.log(req.body.userInputP3);
  try {
    db.execute(insertIntoProjects, [req.body.userInputP1, req.body.userInputP2, req.body.userInputP3]);
    res.redirect("/projects");
  }
  catch (error) {
    next(error);
  }
});

app.post("/projects/:project_id/formulaformsubmit", async function (req, res, next) {
  let project_id = req.params.project_id;
  console.log("HELLO");
  console.log(project_id);
  console.log(req.body.userInput1);
  console.log(req.body.userInput2);
  console.log(req.body.userInput3);
  try {
    db.execute(insertIntoFormulas, [project_id, req.body.userInput1, req.body.userInput3, req.body.userInput2], (error, results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error 
      else {
        res.redirect("/projects/" + project_id + "/trial1/trial1");
      }
    })
  }
  catch (error) {
    next(error);
  }
});


app.post("/projects/:project_id/:formula_id/phaseformsubmit", async function (req, res, next) {
  let project_id = req.params.project_id;
  let formula_id = req.params.formula_id;

  console.log("HELLO");
  console.log(project_id);
  console.log(req.body.userInput1);
  console.log(req.body.userInput2);
  console.log(req.body.userInput3);

  db.execute(insertIntoPhase, [formula_id, req.body.userInput1, req.body.userInput0, req.body.userInput3, req.body.userInput4, req.body.userInput2], (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error 
    else {
      res.redirect("/projects/" + project_id);
    }
  });
});


// app.post("/projects/:project_id/trial:trial_num/computeMax", async function(req, res, next) {
//   let project_id = req.params.project_id
//   let trial_num = req.params.trial_num

//   console.log("IN COMPUTE SECTION")

//   db.execute(getTotalAmountOfFormula, [trial_num, project_id], (error, totalAmount) => {
//     console.log(totalAmount[0].s);
//     db.execute(getIngredientIDs, [trial_num, project_id], (error, ings) => {
//       for (let i = 0; i < ings.length; i++) {
//         console.log(ings[i].ingredient_id);
//         db.execute(getAmount, [project_id, trial_num, ings[i].ingredient_id], (error, amount) => {
//           console.log(amount[0].total_amount);
//           db.execute(computeMax, [amount[0].total_amount, req.body.userInput1, totalAmount[0].s, ings[i].ingredient_id], (error, results) => {
//             if (error)
//               res.status(500).send(error); 
//           });
//         });
//       }
//     });
//   });
//   res.redirect('/projects/' + project_id + '/trial1/trial1');
// });

app.get("/projects/:project_id", (req, res) => {
  let project_id = req.params.project_id

  db.execute(singleProjectQuery, [project_id], (error, project_data) => {
    db.execute(getTrials, [project_id], (error, trial_data) => {
      db.execute(newFormulaDisplay, [project_id], (error, results) => {
        if (error)
          res.status(500).send(error); //Internal Server Error 
        else {
          res.render('formulas', {
            project_id: project_id,
            results: results,
            project_data: project_data,
            trial_data: trial_data
          });
        }
      });
    });
  });
});

app.post("/projects/:project_id/trial:trial_num/makeformsubmit", async function (req, res, next) {
  let project_id = req.params.project_id
  let trial_num = req.params.trial_num

  console.log("IN MAKE SECTION")

  db.execute(getTotalAmountOfFormula, [trial_num, project_id], (error, totalAmount) => {
    console.log(totalAmount[0].s);
    db.execute(getIngredientIDs, [trial_num, project_id], (error, ings) => {
      for (let i = 0; i < ings.length; i++) {
        console.log(ings[i].ingredient_id);
        db.execute(getAmount, [project_id, trial_num, ings[i].ingredient_id], (error, amount) => {
          console.log(amount[0].total_amount);
          db.execute(subtractAmounts, [amount[0].total_amount, req.body.userInput1, totalAmount[0].s, ings[i].ingredient_id], (error, results) => {
            if (error)
              res.status(500).send(error);
          });
        });
      }
    });
  });
  res.redirect('/projects/' + project_id + '/trial1/trial1');
});


app.post("/projects/:project_id/procedure:trial_num/procformsubmit", (req, res) => {
  console.log("HELLO");
  let project_id = req.params.project_id
  let trial_num = req.params.trial_num

  console.log(project_id);
  let userInput1 = req.body.userInput1;
  let userInput2 = req.body.userInput2;
  let userInput3 = req.body.userInput3;
  let userInput4 = req.body.userInput4;
  let userInput5 = req.body.userInput5;
  let userInput6 = req.body.userInput6;
  let userInput7 = req.body.userInput7;
  let userInput8 = req.body.userInput8;
  let userInput9 = req.body.userInput9;
  let userInput10 = req.body.userInput10;


  db.execute(insert_procedure, [userInput1, userInput2, userInput3, userInput4, userInput5, userInput6, userInput7,
    userInput8, userInput9, userInput10, project_id, trial_num], (error, results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error 
      else {
        res.redirect("/projects/" + project_id + "/procedure" + trial_num);
      }
    });
});

app.get("/projects/:project_id/procedure:trial_num", (req, res) => {
  let project_id = req.params.project_id
  let trial_num = req.params.trial_num

  console.log("opening procedure");

  db.execute(get_procedure, [project_id, trial_num], (error, results) => {
    db.execute(get_procedure_info, [project_id], (error, proc_info) => {
      if (error)
        res.status(500).send(error); //Internal Server Error 
      else {
        res.render('procedure', {
          results: results,
          procedure_info: proc_info,
          trial_num: trial_num,
          project_id: project_id
        });
      }
    });
  });
});

// app.get("/projects/:project_id/procedure:trial_num", (req, res) => {
//   let project_id = req.params.project_id
//   let trial_num = req.params.trial_num

//   db.execute(get_procedure, [project_id, trial_num], (error, results) => {
//     db.execute(get_procedure_info, [project_id, trial_num], (error, proc_info) => {
//       db.execute(select_ing_per_phase, [project_id, trial_num, phase_num], (error, ing_data) => {
//         if (error)
//           res.status(500).send(error); //Internal Server Error 
//         else {
//           res.render('procedure', {
//             results: results,
//             procedure_info: proc_info,
//             ing_data: ing_data
//           });
//         }
//       });
//     });
//   });
// });




// figure out how to pull inactive projects too
app.get("/archive", (req, res) => {
  db.execute(read_inactive_ingredients_all_sql, (error, results) => {
    db.execute(read_inactive_projects_all_sql, (error, project_results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error
      else {
        res.render('archive', { results: results, project_results: project_results });
      }
    });
  });
});

app.get("/projects", (req, res) => {
  db.execute(read_projects_all_sql, (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else {
      res.render('projects', { results: results });
    }
  });
});

app.post("/projects/:project_id/formulas/trial/:trial_num", (req, res) => {
  let project_id = req.params.project_id
  let trial_num = req.params.trial_num
  db.execute(singleProjectQuery, [project_id, trial_num], (error, project_data) => {
    db.execute(selectTrialNums, [project_id, trial_num], (error, formula_data) => {
      // need to select formula_ingredients for specific trial_nums for each of the trial_nums in above query
      // perhaps retrieve based on trial_nums that user selects to view? 
      // [project_id, trial_num]
      db.execute(selectFormulaIngredients, [project_id, trial_num], (error, formula_ingredient_data) => {
        if (error)
          res.status(500).send(error); //Internal Server Error
        else {
          // res.render('project', {project_data: results[0]} );
          res.render('formulas', {
            title: 'Project Details',
            styles: ["tables", "event"],
            project_id: project_id,
            project_data: project_data,
            formula_data: formula_data,
            formula_ingredient_data: formula_ingredient_data
          });
        }
      });
    });
  });
});

app.get("/inventory/archive-ingredient/:ingredient_id", (req, res) => {
  let ingredient_id = req.params.ingredient_id
  db.execute(archiveIngredient, [ingredient_id], (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else
      res.redirect('/inventory');
  });
});

app.get("/unarchive-ingredient/:ingredient_id", (req, res) => {
  let ingredient_id = req.params.ingredient_id
  db.execute(unarchiveIngredient, [ingredient_id], (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else
      res.redirect('/archive');
  });
});

app.get("/archive-project/:project_id", (req, res) => {
  let project_id = req.params.project_id
  db.execute(archiveProject, [project_id], (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else
      res.redirect('/projects');
  });
});

app.get("/unarchive-project/:project_id", (req, res) => {
  let project_id = req.params.project_id
  db.execute(unarchiveProject, [project_id], (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else
      res.redirect('/archive#projects');
  });
});

app.get("/logout", (req, res) => {
  logout();
})

app.get("/page", (req, res) => {
  db.execute(read_inventory_all_sql, (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else {
      res.render('page', { results: results });
    }
  });
});

app.get("/created", (req, res) => {
  res.render('created');
});

// app.use('/inventory', function routeHandler(req, res) {
//   res.render('inventory');
// });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});



// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  console.log(err.message);
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// module.exports = router;
module.exports = app

