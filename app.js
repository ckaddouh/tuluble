var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const flash = require('express-flash');
const session = require('express-session');


var indexRouter = require('./routes/index');
var inventoryRouter = require('./routes/inventory');
var projectsRouter = require('./routes/projects');
var formulasRouter = require('./routes/formulas');
var procedureRouter = require('./routes/procedure');
var batchsheetRouter = require('./routes/batchsheet');
var archiveRouter = require('./routes/archive');
var projectAssignRouter = require('./routes/project-assign');

const { auth } = require('express-openid-connect');
const db = require("./db/db_connection");
const hbs = require("hbs");
const moment = require('moment');

hbs.registerHelper('eq', function(a, b) {
  console.log(a);
  console.log(b);
  console.log(a===b);
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

hbs.registerHelper('ifEitherTrue', function(a, b, options) {
  if (a || b) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

hbs.registerHelper('isSelected', function (value, userInput, options) {
  return value === userInput ? 'selected' : '';
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
app.use('/project-assign', projectAssignRouter);


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
 


// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;

  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');

});


app.get("/logout", (req, res) => {
  logout();
})

app.use(function (req, res, next) {
  next(createError(404));
});


// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  console.log(err.message);
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

module.exports = app;