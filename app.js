var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const flash = require('express-flash');
const session = require('express-session');

// var userInput = inventory.get(inputValue1);

var indexRouter = require('./routes/index');
var inventoryRouter = require('./routes/inventory');
var projectsRouter = require('./routes/projects');
var formulasRouter = require('./routes/formulas');
var procedureRouter = require('./routes/procedure');
var batchsheetRouter = require('./routes/batchsheet');
var archiveRouter = require('./routes/archive');

const { auth } = require('express-openid-connect');
const db = require("./db/db_connection");
const hbs = require("hbs");
const moment = require('moment');

// const style = require("css");

hbs.registerHelper('eq', function(a, b) {
  return a === b;
});
hbs.registerHelper('formatDate', function(date) {
  return moment(date).format('LL');
});
hbs.registerHelper('ifBothTrue', function(a, b, options) {
  if (a && b) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

hbs.registerHelper('isSelected', function (value, userInput5, options) {
  return value === userInput5 ? 'selected' : '';
});

const { realpathSync } = require('fs');
const { hasSubscribers } = require('diagnostics_channel');
const { literal, INTEGER } = require('sequelize');
const { Console } = require('console');
const { resolve } = require('path');

const port = 3000;
var app = express();

var isAdmin = false;
var projectsOfScientist = 0;

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

//Routers for different parts of the website
app.use('/', indexRouter);
app.use('/inventory', inventoryRouter);
app.use('/formulas', formulasRouter);
app.use('/projects', projectsRouter);
app.use('/procedure', procedureRouter);
app.use('/batchsheet', batchsheetRouter);
app.use('/archive', archiveRouter);


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
  if (isAdmin)
    next();
  else
    res.redirect("/");
  // next("AGHHH NOT ALLOWED");
}

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

const selectFormulaIngredients = `
  SELECT
    trade_name, inci_name, phase, percent_of_ingredient, total_amount, ingredient.ingredient_id, lot_num
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

const findIngredientID = `
  SELECT ingredient_id
  FROM ingredient
  WHERE ingredient.lot_num = ?
`

const selectSearchedIngredients = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier
  FROM
    ingredient
  WHERE 
    ingredient_id IN ?
    AND classifier_id = ?
`

const read_projects_search_project_assign = `
SELECT
  project_name, projects.project_id, client, date
FROM
  projects
WHERE
  projects.project_name LIKE ?
  AND projects.active = 1
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


const getIngredientIDs = `
  SELECT
    ingredient.ingredient_id
  FROM 
    formula_ingredient, ingredient
  WHERE
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formula_ingredient.trial_num = ?
    AND formula_ingredient.project_id = ?
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
    formula_ingredient
  WHERE
    formula_ingredient.trial_num = ?
    AND formula_ingredient.project_id = ?
`

const getAllScientists = `
  SELECT 
    scientist.name, scientist.scientist_id, scientist.admin, scientist.email
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

const removeScientistFromProject = `
  DELETE FROM 
    project_assign 
  WHERE
    project_id = ?
    AND scientist_id = ?
`

const addScientist = `
  INSERT INTO 
    scientist (name, email, admin)
    VALUES (?, ?, 0)
`

const newFormulaDisplay = `
  SELECT
    formulas.trial_num, trade_name, inci_name, phase, percent_of_ingredient, total_amount, ingredient.ingredient_id, lot_num
  FROM 
    formulas, formula_ingredient, ingredient
  WHERE
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formulas.project_id = formula_ingredient.project_id
    AND formulas.trial_num = formula_ingredient.trial_num
    AND formulas.project_id = ?
    ORDER BY formulas.trial_num
`

const formulaDisplayAttempt3 = `
  SELECT DISTINCT 
    formulas.trial_num, formulas.formula_id, ingredient.trade_name, ingredient.inci_name, formula_ingredient.phase, formula_ingredient.percent_of_ingredient, formula_ingredient.total_amount, ingredient.ingredient_id, ingredient.lot_num
  FROM 
    formulas, formula_ingredient, ingredient
  WHERE 
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formulas.project_id = formula_ingredient.project_id
    AND formulas.trial_num = formula_ingredient.trial_num
    AND formulas.project_id = ?
    ORDER BY formulas.trial_num
`

const getTrialInfo = `
  SELECT DISTINCT 
    formulas.trial_num, formulas.formula_id, ingredient.trade_name, ingredient.inci_name, formula_ingredient.phase, formula_ingredient.percent_of_ingredient, formula_ingredient.total_amount, ingredient.ingredient_id, ingredient.lot_num
  FROM 
    formulas, formula_ingredient, ingredient
  WHERE 
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formulas.project_id = formula_ingredient.project_id
    AND formulas.trial_num = formula_ingredient.trial_num
    AND formulas.project_id = ?
    AND formulas.trial_num = ?
`

const editUser = `
  UPDATE scientist
  SET 
    name = ?,
    email = ?,
    admin = ?
  WHERE 
    scientist_id = ?
`

const deleteUser = `
  DELETE FROM scientist
  WHERE scientist_id = ?
`

const getRemainingScientistsForProject = `
  SELECT * 
  FROM scientist
  WHERE scientist_id NOT IN (SELECT scientist_id FROM project_assign where project_id = ?)
`

const partialsPath = path.join(__dirname, "public/partials");
hbs.registerPartials(partialsPath);
// style.registerPartials(partialsPath);
hbs.registerHelper('ifCond', function (v1, operator, v2, options) {
  switch (operator) {
    case '==':
      return (v1 == v2) ? options.fn(this) : options.inverse(this);
    case '===':
      return (v1 === v2) ? options.fn(this) : options.inverse(this);
    case '!=':
      return (v1 != v2) ? options.fn(this) : options.inverse(this);
    case '!==':
      return (v1 !== v2) ? options.fn(this) : options.inverse(this);
    case '<':
      return (v1 < v2) ? options.fn(this) : options.inverse(this);
    case '<=':
      return (v1 <= v2) ? options.fn(this) : options.inverse(this);
    case '>':
      return (v1 > v2) ? options.fn(this) : options.inverse(this);
    case '>=':
      return (v1 >= v2) ? options.fn(this) : options.inverse(this);
    case '&&':
      return (v1 && v2) ? options.fn(this) : options.inverse(this);
    case '||':
      return (v1 || v2) ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

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
});

app.use(session({
  secret: 'asekfjaosieug8ase9f7jsf', 
  resave: false,
  saveUninitialized: false
}));

app.use(flash());


app.get('/profile', (req, res) => {
  const user = req.oidc.user.nickname;
});

// app.get("/", (req, res) => {
//   db.execute(getLowAmounts, (error, results) => {
//     db.execute(getExpired, (error, results2) => {
//       if (error)
//         res.redirect("/error"); //Internal Server Error
//       else {
//         res.render('index', { runningLow: results, expired: results2, profileInfo: req.oidc.user.nickname });
//       }
//     });
//   });
// });


app.get("/project-assign", requireAdmin, async function (req, res, next) {
  try {
    const results = await new Promise((resolve, reject) => {
      db.execute(read_projects_all_sql, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });


    for (let i = 0; i < results.length; i++) {
      const scientists = await new Promise((resolve, reject) => {
        db.execute(getScientistForProject, [results[i].project_id], (error, scientists) => {
          if (error) reject(error);
          else resolve(scientists);
        });
      });

      results[i].scientists = scientists;
    }

    for (let i = 0; i < results.length; i++) {
      const remainingScientists = await new Promise((resolve, reject) => {
        db.execute(getRemainingScientistsForProject, [results[i].project_id], (error, remainingScientists) => {
          if (error) reject(error);
          else resolve(remainingScientists);
        });
      });

      results[i].remainingScientists = remainingScientists;
    }

    const scientist_data = await new Promise((resolve, reject) => {
      db.execute(getAllScientists, (error, scientist_data) => {
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

    res.render('project_assign', {results: results, scientist_data:scientist_data }); 

  } catch (error) {
    res.status(500).send(error); //Internal Server Error
  }
});


app.get("/project-assign/addScientist/:project_id/:scientist_id", (req, res) => {
  let project_id = req.params.project_id
  let scientist_id = req.params.scientist_id

  db.execute(assignScientistToProject, [project_id, scientist_id], (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else {
      res.redirect('/project-assign');
    }
  });
});

app.get("/project-assign/remove/:project_id/:scientist_id", (req, res) => {
  let project_id = req.params.project_id
  let scientist_id = req.params.scientist_id

  db.execute(removeScientistFromProject, [project_id, scientist_id], (error, results) => {
    if (error)
      res.status(500).send(error); //Internal Server Error
    else {
      res.redirect('/project-assign');
    }
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



app.post("/project-assign/edituser/:scientist_id", async function (req, res, next) {
  let scientist_id = req.params.scientist_id;

  let name = req.body.name;
  let email = req.body.email;
  let admin = req.body.role;



  try {
    if (isAdmin) {
      db.execute(editUser, [name, email, admin, scientist_id]);
      res.redirect("/project-assign");
    }
    else {
      res.redirect("/")
    }
  }
  catch (error) {
    next(error);
  }
});


app.post("/project_assign/deleteuser/:scientist_id", async function (req, res, next) {
  let scientist_id = req.params.scientist_id;

  try {
    if (isAdmin) {
      db.execute(deleteUser, [scientist_id]);
      res.redirect("/project-assign");
    }
    else {
      res.redirect("/");
    }
  }
  catch (error) {
    next(error);
  }
});

 app.get("/project_assign/search/:input", (req, res) => {
  let input = req.params.input;
  let searchStr = `%${input}%`;

  // db.execute(read_project_data_for_assign, [searchStr], (error, results) => {
  db.execute(read_projects_search_project_assign, [searchStr], (error, results) => {
    if (error) reject(error);
    else resolve(results);
  });
});


app.get("/logout", (req, res) => {
  logout();
})

app.get("/page", (req, res) => {
  db.execute(read_inventory_all_sql, (error, results) => {
    if (error)
      res.redirect("/error"); //Internal Server Error
    else {
      res.render('page', { results: results });
    }
  });
});

app.get("/created", (req, res) => {
  res.render('created');
});


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
  console.log(`App listening on port ${port}`)
})

// module.exports = router;
module.exports = app;
