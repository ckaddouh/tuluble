var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var inventoryRouter = require('./routes/inventory');
var formulasRouter = require('./routes/formulas');

const { auth } = require('express-openid-connect');
// const db = require("./db/db");

const port = 3000;
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// require('dotenv').config()

// const authConfig = {
//   authRequired: false,
//   auth0Logout: true,
//   secret: process.env.AUTH_SECRET,
//   baseURL: process.env.AUTH_BASEURL,
//   clientID: process.env.AUTH_CLIENTID,
//   issuerBaseURL: process.env.AUTH_ISSUERBASEURL
// };

// // app.use(auth(authConfig));

// app.use( async (req, res, next) => {
//   res.locals.isAuthenticated = req.oidc.isAuthenticated();
//   if (res.locals.isAuthenticated){
//     // //check if admin
//     // let results = await db.queryPromise("SELECT admin FROM user WHERE email = ?", [req.oidc.user.email])
//     // if (results.length > 0) {
//     //   res.locals.isAdmin = (results[0].admin == 1)
//     // } else {
//       //if no account yet, set up user row in database (account information)
//       //For now, we'll just make a quick "account" with just the email info
//     //   await db.queryPromise("INSERT INTO user (email) VALUES (?)", [req.oidc.user.email]);
//     //   res.locals.isAdmin = false;
//     // }
//   }
//   next();
// })


app.use('/', indexRouter);
// app.use('/inventory', inventoryRouter);
// app.use('/formulas', formulasRouter);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// })

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
// module.exports = app;
