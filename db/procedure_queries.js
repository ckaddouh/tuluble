const db = require("./db_connection");


const get_procedure_query = `
  SELECT 
    phase_num, proc, comments, temp_init, temp_final, timing, mixing_init, mixing_final, mixer_type, blade, project_id, procedure_item_id
  FROM 
    procedure_item
  WHERE 
    project_id = ?
`

const insert_procedure_query = `
  INSERT INTO 
    procedure_item (phase_num, proc, comments, temp_init, temp_final, timing, mixing_init, mixing_final, mixer_type, blade, project_id)
  VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`

const get_procedure_info_query = `
  SELECT 
    projects.project_name
  FROM
    projects
  WHERE
    projects.project_id = ?
`

const checkAdminQuery = `
  SELECT 
    admin 
  FROM 
    scientist 
  WHERE email = ?
`

const delete_procedure_item_query = `
  DELETE FROM
    procedure_item
  WHERE
    procedure_item_id = ?
`

const get_max_phase_query = `
  SELECT 
    COUNT(*) as max
  FROM 
    procedure_item
  WHERE
    project_id = ?
`



function get_procedure(project_id, callback) {
  db.execute(get_procedure_query, [project_id], callback);
}

function insert_procedure(phase_num, proc, comments, temp_init, temp_final, timing, mixing_init, mixing_final, mixer_type, blade, project_id, callback) {
  db.execute(insert_procedure_query, [phase_num, proc, comments, temp_init, temp_final, timing, mixing_init, mixing_final, mixer_type, blade, project_id], callback);
}

function get_procedure_info(project_id, callback) {
  db.execute(get_procedure_info_query, [project_id], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

function delete_procedure_item(procedure_item_id, callback) {
  db.execute(delete_procedure_item_query, [procedure_item_id], callback);
}

function edit_procedure_item(colName, cellContent, phase_num, project_id, callback) {
  db.execute("UPDATE procedure_item SET " + colName + " = ? WHERE phase_num = ? AND project_id = ?", [cellContent, phase_num, project_id], callback);
}

function get_max_phase(project_id, callback) {
  db.execute(get_max_phase_query, [project_id], callback);
}


module.exports = { 
  get_procedure,
  insert_procedure,
  get_procedure_info,
  requireAdmin,
  delete_procedure_item,
  edit_procedure_item,
  get_max_phase
};