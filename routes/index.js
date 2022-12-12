var express = require('express');
var router = express.Router();
// const {requiresAuth} = require('express-openid-connect');

router.get('/', function(req, res, next) {
    res.render('index', { title: ' Home Page ',
                          style: 'index.css'});
  });
  

/* GET home page. */
router.get('/', function(req, res, next) {
  // let username = "";
  // if (req.oidc.isAuthenticated())
  //   username = req.oidc.user.name;
  // res.render('index', { title: 'tuluble ' +  username
  // , style: "index" });
  res.render('index', {title: 'tuluble', style: "index"});
});

// router.get('/profile', requiresAuth(), (req, res) => {
//   res.send(req.oidc.user);
// })

module.exports = router; 


/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
export function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}