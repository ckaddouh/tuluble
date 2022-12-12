var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


// TEST FOR NEW LAPTOP

// var indexRouter = require('./routes/index');
// var inventoryRouter = require('./routes/inventory');
// var formulasRouter = require('./routes/formulas');

const { auth } = require('express-openid-connect');
const db = require("./db/db_connection");

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
        formula_id, test_name
    FROM
        formulas
`

// app.use('/', indexRouter);
// app.use('/inventory', inventoryRouter);
// app.use('/formulas', formulasRouter);

// app.get('/', (req, res) => {
//   res.send(
//     req.oidc.isAuthenticated() ? res.render('index') : open('https://dev-gm9sesne.us.auth0.com/u/login?state=hKFo2SAtUWpZODh1R0tubjBZZFBOUnBjR0RPZzBQS0hxYTFLX6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFFRMWRRRUREcWJYS0xtSVhlMzVTTnVIN3pOZUpldjdio2NpZNkgWnV0Z2tQWE9DYWdLNTNoOGdHTkx1RENqbGFLRDJralI')
//   )
// }); 
app.get("/", (req, res) =>{
  res.render('index');
});

app.get( "/inventory", ( req, res ) => {
  db.execute(read_inventory_all_sql, (error, results) => {
      if (error)
          res.status(500).send(error); //Internal Server Error
      else{
          res.render('inventory', {results: results} );
      }
  });
});

app.get("/logout", ( req, res ) => {
  logout();
})

app.get("/page", (req, res) =>{
  db.execute(read_inventory_all_sql, (error, results) => {
      if (error)
          res.status(500).send(error); //Internal Server Error
      else{
          res.render('page', {results: results} );
      }
  });
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
// module.exports = app;
