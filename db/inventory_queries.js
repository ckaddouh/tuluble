const db = require("./db_connection");

const read_inventory_all_sql_query = `
    SELECT
        ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, supplier, coa, msds, cost, encoding, hazardDetails
    FROM
        ingredient
    WHERE 
      classifier_id = "Oils" AND active = 1
`

const read_inventory_classifier_sql_query = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, supplier, cost, encoding, hazardDetails
  FROM
    ingredient
  WHERE 
    classifier_id = ?
`;

const read_inventory_search_query = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, supplier, coa, msds, cost, encoding, hazardDetails
  FROM
    ingredient
  WHERE 
    inci_name LIKE ?
`;

const updateIngredient_query = `
  UPDATE 
    ingredient
  SET 
    inci_name = ?, trade_name = ?, amt = ?, shelf = ?, classifier_id = ?, lot_num = ?, date_received = ?, supplier = ?, coa = ?, msds = ?, expiration = ?, cost = ?, hazardDetails = ?, encoding = ?
  WHERE 
    ingredient_id = ?
`;

const archiveIngredient_query = `
  UPDATE ingredient
  SET active = 0
  WHERE ingredient_id = ?
`;

const checkAdminQuery = `
  SELECT 
    admin 
  FROM 
    scientist 
  WHERE email = ?
`

const insertIntoInventoryQuery = `
  INSERT INTO 
    ingredient (inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, supplier, coa, msds, expiration, encoding, hazardDetails)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`


function read_inventory_all_sql(callback) {
  db.execute(read_inventory_all_sql_query, callback);
}

function read_inventory_classifier_sql(classifierId, callback) {
  db.execute(read_inventory_classifier_sql_query, [classifierId], callback);
}

function read_inventory_search(searchStr, callback) {
  db.execute(read_inventory_search_query, [searchStr], callback);
}
        
function updateIngredient(inci_name, trade_name, amt, shelf, classifier_id, lot_num,
    date_received, supplier, coa, msds, expiration, cost, hazardDetails, encoding, ingredient_id, callback) {
  db.execute(updateIngredient_query, [inci_name, trade_name, amt, shelf, classifier_id, lot_num,
    date_received, supplier, coa, msds, expiration, cost, hazardDetails, encoding, ingredient_id], callback);
}

function archiveIngredient(ingredientId, callback) {
  db.execute(archiveIngredient_query, [ingredientId], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

function insertIntoInventory(inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, 
  supplier, coa, msds, expiration, encoding, hazardousDetails, callback) {
    db.execute(insertIntoInventoryQuery, [inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, 
      supplier, coa, msds, expiration, encoding, hazardousDetails], callback);
  }

module.exports = {
  read_inventory_all_sql,
  read_inventory_classifier_sql,
  read_inventory_search,
  insertIntoInventory,
  updateIngredient,
  archiveIngredient,
  requireAdmin
};
