var express = require('express');
var router = express.Router();
// const {requiresAuth} = require('express-openid-connect');

router.get('/', function(req, res, next) {
    res.render('welcome', { title: ' Welcome ',
                          style: 'welcome.css'});
  });

/* GET home page. */
router.get('/', function(req, res, next) {
  // let username = "";
  // if (req.oidc.isAuthenticated())
  //   username = req.oidc.user.name;
  // res.render('index', { title: 'tuluble ' +  username
  // , style: "index" });
  res.render('welcome', {title: 'tuluble', style: 'welcome.css'});
});

// router.get('/profile', requiresAuth(), (req, res) => {
//   res.send(req.oidc.user);
// })

module.exports = router; 