const express = require('express');
var router = express.Router();
const db = require("../db/index_queries.js");
const { auth } = require('express-openid-connect');

const authConfig = {
  authRequired: true,
  auth0Logout: true,
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_BASEURL,
  clientID: process.env.AUTH_CLIENTID,
  issuerBaseURL: process.env.AUTH_ISSUERBASEURL
};



router.use(auth(authConfig));

router.get('/', async function (req, res, next) {
  let error;
  
  const admin = await new Promise((resolve, reject) => {
    db.requireAdmin(req.oidc.user.email, (error, admin) => {
      if (error) reject (error);
      else resolve(admin);
    });
  });

  if (admin[0].admin === 0 || admin[0].admin === 1) {
    if (error) {
      res.redirect('/error'); // Internal Server Error
    } else {
      db.getExpired((error, expired) => {
        if (error) {
          res.redirect('/error'); // Internal Server Error
        } else {
          res.render('index', {expired, profileInfo: req.oidc.user.nickname, isAdmin: admin[0].admin});
        }
      });
    }
  }
  else {
    res.redirect("/inventory");
  }
});


module.exports = router;
