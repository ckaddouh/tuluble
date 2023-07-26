const db = require("./db_connection");

const read_inventory_all_sql_query = `
    SELECT
        ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, supplier, coa, msds, cost, encoding
    FROM
        ingredient
    WHERE 
      classifier_id = "Oils" AND active = 1
`

const read_inventory_classifier_sql_query = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, supplier, cost, encoding, hazardous
  FROM
    ingredient
  WHERE 
    classifier_id = ?
`;

const read_inventory_search_query = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, supplier, coa, msds, cost, encoding, hazardous
  FROM
    ingredient
  WHERE 
    inci_name LIKE ?
`;

const updateIngredient_query = `
  UPDATE 
    ingredient
  SET 
    inci_name = ?, trade_name = ?, amt = ?, shelf = ?, classifier_id = ?, lot_num = ?, date_received = ?, supplier = ?, coa = ?, msds = ?, expiration = ?, cost = ?, hazardous = ?, hazardDetails = ?, encoding = ?
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
    ingredient (inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, supplier, coa, msds, expiration, encoding, hazardous, hazardousDetails)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

function updateIngredient(userInput1, userInput2, userInput3, userInput4, userInput5, userInput6,
    userInput7, userInput8, userInput10, userInput11, userInput12, userInput13, ingredientId, callback) {
  db.execute(updateIngredient_query, [userInput1, userInput2, userInput3, userInput4, userInput5, userInput6,
    userInput7, userInput8, userInput10, userInput11, userInput12, userInput13, ingredientId], callback);
}

function archiveIngredient(ingredientId, callback) {
  db.execute(archiveIngredient_query, [ingredientId], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

function insertIntoInventory(inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, 
  supplier, coa, msds, expiration, encoding, hazardous, hazardousDetails, callback) {
    db.execute(insertIntoInventoryQuery, [inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, 
      supplier, coa, msds, expiration, encoding, hazardous, hazardousDetails], callback);
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
