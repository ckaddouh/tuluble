const db = require("./db_connection");


const get_procedure_query = `
  SELECT 
    phase_num, proc, comments, temp_init, temp_final, timing, mixing_init, mixing_final, mixer_type, blade, project_id
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


module.exports = { 
  get_procedure,
  insert_procedure,
  get_procedure_info,
  requireAdmin
};