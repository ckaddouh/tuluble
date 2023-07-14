const db = require("./db_connection");


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

const getIngredientTrialInfoQuery = `
  SELECT 
    trial_num, percent_of_ingredient, ingredient_id, phase
  FROM 
    formula_ingredient
  WHERE 
    project_id = ? AND trial_num = ? AND ingredient_id = ?
`

const subtractAmountsQuery = `
  UPDATE
    ingredient
  SET 
    amt = amt - ?
  WHERE 
    ingredient_id = ?
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

const singleProjectQuery = `
    SELECT
        project_name, project_id, client, date, client_name, client_email
    FROM
        projects
    WHERE
      projects.project_id = ?
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

const getIngAmountQuery = `
  SELECT amt
  FROM ingredient
  WHERE ingredient_id = ?
`

const checkAdminQuery = `
  SELECT 
    admin 
  FROM 
    scientist 
  WHERE email = ?
`

const get_procedure_query = `
  SELECT 
    phase_num, proc, comments, temp_init, temp_final, timing, mixing_init, mixing_final, mixer_type, blade, project_id, procedure_item_id
  FROM 
    procedure_item
  WHERE 
    project_id = ?
`

function getFormulaIngredientsForTrial(project_id, trial_num, callback) {
    db.execute(getFormulaIngredientsForTrialQuery, [project_id, trial_num], callback);
}

function getIngredientTrialInfo(project_id, trial_num, ingredient_id, callback) {
    db.execute(getIngredientTrialInfoQuery, [project_id, trial_num, ingredient_id], callback);
}

function subtractAmounts(amt, ingredient_id, callback) {
    db.execute(subtractAmountsQuery, [amt, ingredient_id], callback);
}

function markUneditable(project_id, trial_num, callback) {
    db.execute(markUneditableQuery, [project_id, trial_num], callback);
}

function getScientistID(email, callback) {
    db.execute(getScientistIDQuery, [email], callback);
}

function getAssignedProjects(scientist_id, project_id, callback) {
    db.execute(getAssignedProjectsQuery, [scientist_id, project_id], callback);
}

function singleProject(project_id, callback) {
    db.execute(singleProjectQuery, [project_id], callback);
}

function selectTrialSums(project_id, trial_num, callback) {
    db.execute(selectTrialSumsQuery, [project_id, trial_num], callback);
}

function read_inventory_all_alph(callback) {
    db.execute(read_inventory_all_alph_query, callback);
}

function getIngAmount(ingredient_id, callback) {
    db.execute(getIngAmountQuery, [ingredient_id], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

function get_procedure(project_id, callback) {
  db.execute(get_procedure_query, [project_id], callback);
}

module.exports = {
    getFormulaIngredientsForTrial,
    getIngredientTrialInfo,
    subtractAmounts,
    markUneditable,
    getScientistID,
    getAssignedProjects,
    singleProject,
    selectTrialSums,
    read_inventory_all_alph,
    getIngAmount,
    requireAdmin,
    get_procedure
};