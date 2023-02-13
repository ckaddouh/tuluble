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

const port = 3000;
var app = express();

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

const read_inventory_all_sql = `
    SELECT
        ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, unit
    FROM
        ingredient
    WHERE 
      classifier_id = "Oils" AND active = 1
`

const read_projects_all_sql = `
    SELECT
        project_name, project_id, client, date
    FROM
        projects
    WHERE 
      active = 1
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
    trade_name, inci_name, phase, percent_of_ingredient, total_amount, ingredient.ingredient_id
  FROM 
    formulas, formula_ingredient, ingredient
  WHERE
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formulas.formula_id = formula_ingredient.formula_id
    AND formulas.trial_num = 1
    AND formulas.project_id = ?
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
    ingredient (inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, supplier, unit)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

const partialsPath = path.join(__dirname, "public/partials");
hbs.registerPartials(partialsPath);
// style.registerPartials(partialsPath);

app.get("/", (req, res) => {
  res.render('index');
});

app.get("/test", (req, res) => {
  res.render('testpage');
});

// app.get("/index", (req, res) =>{
//   res.render('index');
// });

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

// app.get("/inventoryformsubmit/:value1/:value2/:value3", (req, res) => {
//   let value1 = req.params.value1
//   let value2 = req.params.value2
//   let value3 = req.params.value3
//   db.execute(insertIntoInventory, [value1, value2, value3], (error, results) => {
//     if (error)
//       res.status(500).send(error); //Internal Server Error
//     else {
//       app.route('/inventory')
//     }
//   });
// });

app.post("/inventoryformsubmit", async function(req, res, next) {
  console.log("HELLO");
  console.log(req.body.userInput1);
  try {
    let results = await db.promise(insertIntoInventory, [req.body.userInput1, req.body.userInput2, 
      req.body.userInput3, req.body.userInput3, req.body.userInput4, req.body.userInput5, req.body.userInput6, 
      req.body.userInput7, req.body.userInput8, req.body.userInput9]); 

      res.redirect("/inventory");
  }
  catch(error) {
    next(error);
  }
});



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

app.get("/projects/:project_id", (req, res) => {
  let project_id = req.params.project_id
  db.execute(singleProjectQuery, [project_id], (error, results) => {
    db.execute(selectTrialNums, [project_id], (error, formula_results) => {
      if (error)
        res.status(500).send(error); //Internal Server Error
      else {
        // res.render('project', {project_data: results[0]} );
        res.render('project', {
          title: 'Project Details',
          styles: ["tables", "event"],
          project_id: project_id,
          results: results,
          formula_results: formula_results
        });
        //app.route("/projects/:{{project_id}}/formulas");
      }
    });
  });
});

app.get("/projects/:project_id/formulas", (req, res) => {
  let project_id = req.params.project_id
  db.execute(singleProjectQuery, [project_id], (error, project_data) => {
    db.execute(selectTrialNums, [project_id], (error, formula_data) => {
      // need to select formula_ingredients for specific trial_nums for each of the trial_nums in above query
      // perhaps retrieve based on trial_nums that user selects to view? 
      // [project_id, trial_num]
      db.execute(selectFormulaIngredients, [project_id], (error, formula_ingredient_data) => {
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

app.get("/projects/:project_id/formulas", (req, res) => {
  let project_id = req.params.project_id
  db.execute(singleProjectQuery, [project_id], (error, project_data) => {
    db.execute(selectTrialNums, [project_id], (error, formula_data) => {
      // need to select formula_ingredients for specific trial_nums for each of the trial_nums in above query
      // perhaps retrieve based on trial_nums that user selects to view? 
      // [project_id, trial_num]
      db.execute(selectFormulaIngredients, [project_id], (error, formula_ingredient_data) => {
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

app.get("/archive-ingredient/:ingredient_id", (req, res) => {
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

