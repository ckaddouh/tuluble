const db = require("./db_connection");


const getExpiredQuery = `
  SELECT
    ingredient_id, inci_name, trade_name, amt, expiration
  FROM 
    ingredient
  WHERE
    ingredient.expiration <= UTC_DATE()
    AND ingredient.active = 1
`

const checkAdminQuery = `
  SELECT 
    admin 
  FROM 
    scientist 
  WHERE email = ?
`


function getExpired(callback) {
  db.execute(getExpiredQuery, callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}


module.exports = { getExpired, requireAdmin };