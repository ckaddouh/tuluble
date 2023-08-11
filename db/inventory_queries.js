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
    classifier_id = ? AND active = 1
`;

const read_inventory_search_query = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, supplier, coa, msds, cost, encoding, hazardDetails
  FROM
    ingredient
  WHERE 
  (inci_name LIKE ? OR lot_num LIKE ? OR encoding LIKE ?)
  AND active = 1
`;

const insertIntoInventory_query = `
  INSERT INTO 
    ingredient (inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, supplier, coa, msds, expiration, hazardous, encoding, hazardDetails, cost, active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
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
    ingredient (inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, supplier, coa, msds, expiration, encoding, hazardDetails, cost, active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`

const getExistingFilePathsQuery = `
  SELECT 
    coa, msds
  FROM
    ingredient
  WHERE
    ingredient_id = ?
`


function read_inventory_all_sql(callback) {
  db.execute(read_inventory_all_sql_query, callback);
}

function read_inventory_classifier_sql(classifierId, callback) {
  db.execute(read_inventory_classifier_sql_query, [classifierId], callback);
}

function read_inventory_search(searchStr, callback) {
  db.execute(read_inventory_search_query, [searchStr, searchStr, searchStr], callback);
}
        
function updateIngredient(editInciName, editTradeName, editAmount, editShelf, editClassifier, editLotNum,
    editReceived, editSupplier, editCOA, editMSDS, editExpiration, editCost, hazardDetails, editEncoding, ingredient_id, callback) {
  db.execute(updateIngredient_query, [editInciName, editTradeName, editAmount, editShelf, editClassifier, editLotNum,
    editReceived, editSupplier, editCOA, editMSDS, editExpiration, editCost, hazardDetails, editEncoding, ingredient_id], callback);
}

function archiveIngredient(ingredientId, callback) {
  db.execute(archiveIngredient_query, [ingredientId], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

function insertIntoInventory(newInciName, newTradeName, newAmount, newShelf, newClassifier, newLotNum, newReceived, 
  newSupplier, newCOA, newMSDS, newExpiration, newEncoding, hazardousDetails, newCost, callback) {
    db.execute(insertIntoInventoryQuery, [newInciName, newTradeName, newAmount, newShelf, newClassifier, newLotNum, newReceived, 
      newSupplier, newCOA, newMSDS, newExpiration, newEncoding, hazardousDetails, newCost], callback);
}

function getExistingFilePaths(ingredient_id, callback) {
  db.execute(getExistingFilePathsQuery, [ingredient_id], callback);
}

module.exports = {
  read_inventory_all_sql,
  read_inventory_classifier_sql,
  read_inventory_search,
  insertIntoInventory,
  updateIngredient,
  archiveIngredient,
  requireAdmin,
  getExistingFilePaths
};
