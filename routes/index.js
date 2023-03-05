var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: ' Home Page ',
                        style: 'index.hbs'});
});

module.exports = router;


// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: ' Home Page ',
//                         style: 'index.hbs'});
//   res.send(
//     req.oidc.isAuthenticated() ? res.render('index') : open('https://dev-gm9sesne.us.auth0.com/u/login?state=hKFo2SAtUWpZODh1R0tubjBZZFBOUnBjR0RPZzBQS0hxYTFLX6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFFRMWRRRUREcWJYS0xtSVhlMzVTTnVIN3pOZUpldjdio2NpZNkgWnV0Z2tQWE9DYWdLNTNoOGdHTkx1RENqbGFLRDJralI')
//   )
// });

// module.exports = router;
