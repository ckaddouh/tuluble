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
const readIndexClassifierSqlQuery = `
SELECT
  ingredient_id, inci_name, trade_name, amt, expiration
FROM 
  ingredient
WHERE
  ingredient.expiration <= UTC_DATE()
  AND ingredient.active = 1
  AND classifier_id = ?
`


function getExpired(callback) {
  db.execute(getExpiredQuery, callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

function readIndexClassifierSql(classifier, callback) {
  db.execute(readIndexClassifierSqlQuery, [classifier], callback);
}

module.exports = { getExpired, requireAdmin, readIndexClassifierSql};