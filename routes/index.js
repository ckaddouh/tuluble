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

router.get('/', (req, res, next) => {
  db.getLowAmounts((error, results) => {
    if (error) {
      res.redirect('/error'); // Internal Server Error
    } else {
      db.getExpired((error, results2) => {
        if (error) {
          res.redirect('/error'); // Internal Server Error
        } else {
          res.render('index', { runningLow: results, expired: results2, profileInfo: req.oidc.user.nickname});
        }
      });
    }
  });
});

module.exports = router;
