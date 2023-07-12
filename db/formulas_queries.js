const db = require("./db_connection");


const insertIntoPhaseQuery = `
  INSERT INTO formula_ingredient (project_id, trial_num, phase, percent_of_ingredient, ingredient_id)
  VALUES (?, ?, ?, ?, ?)
`

const editFormulaIngredientQuery = `
  UPDATE 
    formula_ingredient 
  SET 
    percent_of_ingredient = ? 
  WHERE project_id = ? 
    AND trial_num = ? 
    AND ingredient_id = ?
`

const insertIntoFormulasQuery = `
  INSERT INTO formulas (project_id, trial_num, batch_date, formulator, editable)
  VALUES (?, ?, ?, ?, 1)
`

const singleProjectQuery = `
    SELECT
        project_name, project_id, client, date, client_name, client_email
    FROM
        projects
    WHERE
        projects.project_id = ?
`

const getTrialsQuery = `
  SELECT DISTINCT trial_num
  FROM formulas
  WHERE project_id = ?
  ORDER BY trial_num
`

const getFormulaIngredientsQuery= `
  SELECT DISTINCT 
    ingredient.ingredient_id, ingredient.supplier, formula_ingredient.project_id, formula_ingredient.phase, ingredient.trade_name, ingredient.inci_name, formula_ingredient.phase, ingredient.lot_num
  FROM 
	  formula_ingredient, ingredient
  WHERE 
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formula_ingredient.project_id = ?
	  GROUP BY ingredient.ingredient_id
    ORDER BY formula_ingredient.phase
`

const getFormulaIngredientsENCODEDQuery= `
  SELECT DISTINCT 
    ingredient.ingredient_id, ingredient.supplier, formula_ingredient.project_id, formula_ingredient.phase, ingredient.encoding, formula_ingredient.phase, ingredient.lot_num
  FROM 
	  formula_ingredient, ingredient
  WHERE 
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formula_ingredient.project_id = ?
	  GROUP BY ingredient.ingredient_id
    ORDER BY formula_ingredient.phase
`

const selectTrialSumsQuery = `
  SELECT  
    SUM(formula_ingredient.percent_of_ingredient) as percentSum
  FROM 
    formula_ingredient
  WHERE 
    formula_ingredient.project_id = ?
    AND formula_ingredient.trial_num = ?
`

const getApprovedQuery = `
  SELECT 
    approved
  FROM 
    formulas
  WHERE
    project_id = ?
    AND trial_num = ?
`

const getIngredientTrialInfoQuery = `
  SELECT 
    trial_num, percent_of_ingredient, ingredient_id, phase
  FROM 
    formula_ingredient
  WHERE 
    project_id = ? AND trial_num = ? AND ingredient_id = ?
`

const getEditabilityQuery = `
  SELECT 
    editable
  FROM 
    formulas
  WHERE
    project_id = ?
    AND trial_num = ?
`

const read_inventory_all_alph_query = `
    SELECT
        ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, coa, msds
    FROM
        ingredient
    WHERE 
      active = 1
      AND inci_name != ''
    ORDER BY 
      inci_name ASC
`

const removeTrialApprovalQuery = `
  UPDATE
    formulas
  SET
    approved = 0
  WHERE
    project_id = ?
    AND trial_num = ?
`

const getFormulaIngredientsForTrialQuery = `
  SELECT DISTINCT 
    ingredient.ingredient_id, ingredient.supplier, formula_ingredient.project_id, formula_ingredient.phase, ingredient.trade_name, ingredient.inci_name, formula_ingredient.phase, ingredient.lot_num
  FROM 
	  formula_ingredient, ingredient
  WHERE 
    formula_ingredient.ingredient_id = ingredient.ingredient_id
    AND formula_ingredient.project_id = ?
    AND formula_ingredient.trial_num = ?
	  GROUP BY ingredient.ingredient_id
    ORDER BY formula_ingredient.phase
`

const markUneditableQuery = `
  UPDATE 
    formulas
  SET 
    editable = 0
  WHERE 
    project_id = ?
    AND trial_num = ?
`

const getIngAmountQuery = `
  SELECT amt
  FROM ingredient
  WHERE ingredient_id = ?
`

const delete_trial_query = `
  DELETE FROM
    formulas
  WHERE
    project_id = ?
    AND trial_num = ?
`

const delete_trial2_query = `
  DELETE FROM
    formula_ingredient
  WHERE
    project_id = ?
    AND trial_num = ?
`

const approve_trial_query = `
  UPDATE
    formulas
  SET
    approved = 1
  WHERE
    project_id = ?
    AND trial_num = ?
`

const delete_formula_ingredient_query = `
  DELETE FROM 
    formula_ingredient
  WHERE
    project_id = ?
    AND ingredient_id = ?
`
const getScientistIDQuery = `
  SELECT 
      scientist_id 
  FROM 
      scientist 
  WHERE 
      email = ?
`

const getAssignedProjectsQuery = `
  SELECT * 
  FROM
    project_assign
  WHERE
    scientist_id = ? 
    AND project_id = ?
`

const checkAdminQuery = `
  SELECT 
    admin 
  FROM 
    scientist 
  WHERE email = ?
`

function insertIntoPhase(project_id, trial_num, phase, cellContent, ingredient_id, callback) {
    db.execute(insertIntoPhaseQuery, [project_id, trial_num, phase, cellContent, ingredient_id], callback);
}

function editFormulaIngredient(percent, project_id, trial_num, ingredient_id, callback) {
  db.execute(editFormulaIngredientQuery, [percent, project_id, trial_num, ingredient_id], callback);
}

function insertIntoFormulas(project_id, trial_num, batch_date, formulator, callback) {
  db.execute(insertIntoFormulasQuery, [project_id, trial_num, batch_date, formulator], callback);
}

function singleProject(project_id, callback) {
  db.execute(singleProjectQuery, [project_id], callback);
}

function getTrials(project_id, callback) {
  db.execute(getTrialsQuery, [project_id], callback);
}

function getFormulaIngredients(project_id, callback) {
  db.execute(getFormulaIngredientsQuery, [project_id], callback);
}

function getFormulaIngredientsEncoded(project_id, callback) {
  db.execute(getFormulaIngredientsENCODEDQuery, [project_id], callback);
}

function selectTrialSums(project_id, trial_num, callback) {
  db.execute(selectTrialSumsQuery, [project_id, trial_num], callback);
}

function getApproved(project_id, trial_num, callback) {
  db.execute(getApprovedQuery, [project_id, trial_num], callback);
}

function getIngredientTrialInfo(project_id, trial_num, ingredient_id, callback) {
  db.execute(getIngredientTrialInfoQuery, [project_id, trial_num, ingredient_id], callback);
}

function getEditability(project_id, trial_num, callback) {
  db.execute(getEditabilityQuery, [project_id, trial_num], callback);
}

function read_inventory_all_alph(callback) {
  db.execute(read_inventory_all_alph_query, callback);
}

function removeTrialApproval(project_id, trial_num, callback) {
  db.execute(removeTrialApprovalQuery, [project_id, trial_num], callback);
}

function getFormulaIngredientsForTrial(project_id, trial_num, callback) {
  db.execute(getFormulaIngredientsForTrialQuery, [project_id, trial_num], callback);
}

function markUneditable(project_id, trial_num, callback) {
  db.execute(markUneditableQuery, [project_id, trial_num], callback);
}

function getIngAmount(ingredient_id, callback) {
  db.execute(getIngAmountQuery, [ingredient_id], callback);
}

function delete_trial(project_id, trial_num, callback) {
  db.execute(delete_trial_query, [project_id, trial_num], callback);
}

function delete_trial2(project_id, trial_num, callback) {
  db.execute(delete_trial2_query, [project_id, trial_num], callback);
}

function approve_trial(project_id, trial_num, callback) {
  db.execute(approve_trial_query, [project_id, trial_num], callback);
}

function delete_formula_ingredient(project_id, ingredient_id, callback) {
  db.execute(delete_formula_ingredient_query, [project_id, ingredient_id], callback);
}

function getScientistID(email, callback) {
  db.execute(getScientistIDQuery, [email], callback);
}

function getAssignedProjects(scientist_id, project_id, callback) {
  db.execute(getAssignedProjectsQuery, [scientist_id, project_id], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

module.exports = { 
  insertIntoPhase, 
  editFormulaIngredient, 
  insertIntoFormulas, 
  singleProject, 
  getTrials, 
  getFormulaIngredients, 
  getFormulaIngredientsEncoded,
  selectTrialSums, 
  getApproved, 
  getIngredientTrialInfo, 
  getEditability, 
  read_inventory_all_alph,
  removeTrialApproval,
  getFormulaIngredientsForTrial,
  markUneditable,
  getIngAmount,
  delete_trial,
  delete_trial2,
  approve_trial,
  delete_formula_ingredient,
  getScientistID,
  getAssignedProjects,
  requireAdmin
};