const db = require("./db_connection");

const read_inventory_all_sql_query = `
    SELECT
        ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, coa, msds, cost, encoding, hazardous, hazardDetails
    FROM
        ingredient
    WHERE 
      classifier_id = "Oils" AND active = 1
`

const read_inventory_classifier_sql_query = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, cost, encoding, hazardous, hazardDetails
  FROM
    ingredient
  WHERE 
    classifier_id = ?
`;

const read_inventory_search_query = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, coa, msds, cost, encoding, hazardous, hazardDetails
  FROM
    ingredient
  WHERE 
    inci_name LIKE ?
`;

const insertIntoInventory_query = `
  INSERT INTO 
    ingredient (inci_name, trade_name, amt, shelf, classifier_id, lot_num, date_received, supplier, coa, msds, expiration, hazardous, encoding, hazardDetails, cost)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const updateIngredient_query = `
  UPDATE 
    ingredient
  SET 
    inci_name = ?, trade_name = ?, amt = ?, shelf = ?, classifier_id = ?, lot_num = ?, date_received = ?, supplier = ?, coa = ?, msds = ?, expiration = ?, hazardous = ?, encoding = ?, hazardDetails = ?, cost = ?
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

function read_inventory_all_sql(callback) {
  db.execute(read_inventory_all_sql_query, callback);
}

function read_inventory_classifier_sql(classifierId, callback) {
  db.execute(read_inventory_classifier_sql_query, [classifierId], callback);
}

function read_inventory_search(searchStr, callback) {
  db.execute(read_inventory_search_query, [searchStr], callback);
}

function insertIntoInventory(newInciName, newTradeName, newAmount, newShelf, newClassifier, newLotNum,
    newReceived, newSupplier, newCOA, newMSDS, newExpiration, hazardousSwitch, newEncoding, hazardDetails, newCost, callback) {
  db.execute(insertIntoInventory_query, [newInciName, newTradeName, newAmount, newShelf, newClassifier, newLotNum,
    newReceived, newSupplier, newCOA, newMSDS, newExpiration, hazardousSwitch, newEncoding, hazardDetails, newCost], callback);
}

function updateIngredient(editInciName, editTradeName, editAmount, editShelf, editClassifier, editLotNum,
    editReceived, editSupplier, editCOA, editMSDS, editExpiration, hazardousSwitchEdit, editEncoding, hazardDetailsEdit, editCost, ingredientId, callback) {
  db.execute(updateIngredient_query, [editInciName, editTradeName, editAmount, editShelf, editClassifier, editLotNum,
    editReceived, editSupplier, editCOA, editMSDS, editExpiration, hazardousSwitchEdit, editEncoding, hazardDetailsEdit, editCost, ingredientId], callback);
}

function archiveIngredient(ingredientId, callback) {
  db.execute(archiveIngredient_query, [ingredientId], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
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
