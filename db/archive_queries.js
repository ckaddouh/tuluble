const db = require("./db_connection");

const read_archive_inventory_search_query = `
SELECT
  ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, supplier, coa, msds, cost
FROM
  ingredient
WHERE
  ingredient.inci_name LIKE ? AND ingredient.active = 0
`

const getScientistIDQuery = `
  SELECT 
      scientist_id 
  FROM 
      scientist 
  WHERE 
      email = ?
`

const read_inactive_ingredients_all_sql_query = `
  SELECT
    ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, supplier, cost
  FROM
    ingredient
  WHERE 
    active = 0
`

const read_inactive_projects_all_sql_query = `
  SELECT
    project_name, project_id, client, date
  FROM
    projects
  WHERE 
    active = 0
`

const read_inactive_projects_archived_query = `
  SELECT
    DISTINCT projects.project_name, projects.project_id, client, date
  FROM
    projects, project_assign
  WHERE 
    active = 0
    AND project_assign.scientist_id = ?
    AND project_assign.project_id = projects.project_id
`

const unarchiveIngredientQuery = `
  UPDATE ingredient
  SET active = 1
  WHERE ingredient_id = ?
`

const unarchiveProjectQuery = `
  UPDATE projects
  SET active = 1
  WHERE project_id = ?
`

const checkAdminQuery = `
  SELECT 
    admin 
  FROM 
    scientist 
  WHERE email = ?
`


function read_archive_inventory_search(inci_name, callback) {
    db.execute(read_archive_inventory_search_query, [inci_name], callback);
}

function getScientistID(email, callback) {
    db.execute(getScientistIDQuery, [email], callback);
}

function read_inactive_ingredients_all_sql(callback) {
    db.execute(read_inactive_ingredients_all_sql_query, callback);
}

function read_inactive_projects_all_sql(callback) {
    db.execute(read_inactive_projects_all_sql_query, callback);
}

function read_inactive_projects_archived(scientist_id, callback) {
    db.execute(read_inactive_projects_archived_query, [scientist_id], callback);
}

function unarchiveIngredient(ingredient_id, callback) {
    db.execute(unarchiveIngredientQuery, [ingredient_id], callback);
}

function unarchiveProject(project_id, callback) {
    db.execute(unarchiveProjectQuery, [project_id], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

module.exports = {
  read_archive_inventory_search,
  getScientistID,
  read_inactive_ingredients_all_sql,
  read_inactive_projects_all_sql,
  read_inactive_projects_archived,
  unarchiveIngredient,
  unarchiveProject,
  requireAdmin
}